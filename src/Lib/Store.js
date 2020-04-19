class Store {
	static fieldTypes = {
		required: 1,
		unique: 2,
		autoIncrement: 4,
		_reserved2: 8,
		_reserved3: 16,
		_reserved4: 32,
		_reserved5: 64,
		_reserved6: 128,
		int: 256,
		float: 512,
		string: 1024,
		date: 2048,
		bool: 4096
	};

	constructor(options) {
		this.key = options.key;
		if(this.key == null)
			this.key = 'key';
	}

	/* interface methods */
	async byKey(key) { throw new Error('not implemented'); }
	async fetch() { throw new Error('not implemented'); }
	async set(items) { throw new Error('not implemented'); }
	async insert(item) { throw new Error('not implemented'); }
	async update(item) { throw new Error('not implemented'); }
	async remove(key) { throw new Error('not implemented'); }
	async nextKey() { throw new Error('not implemented'); }

	/* entity factory */
	async makeNew() {
		return {
			key: await this.nextKey()
		};
	}

	clone(item) {
		return JSON.parse(JSON.stringify(item));
	}

	removeBag(item) {
		if(item != null && '_bag' in item)
			delete item._bag;
	}

	/* validation utilities */
	*validate(item) {}
	isValid(item) {
		var errors = this.validate(item).next();
		return errors.done;
	}
	assertValid(item) {
		var result = [...this.validate(item)];
		if(result.length > 0)
			throw new Error(result.join('\n'));
	}
	isNullOrWhiteSpace(value) {
		return value === null || value === undefined || value === '';
	}
}

class IndexedDbStore extends Store {
	constructor(options) {
		super(options);
		if(!window.indexedDB)
			throw new Error('IndexedDB is not supported');

		this.dbName = options.dbName;
		if(this.dbName == null)
			this.dbName = 'Store';
		this.tableName = options.id;
		if(this.tableName == null)
			throw new Error('options.tableName is undefined');
		this.fields = options.fields;
		if(this.fields == null)
			throw new Error('options.fields is undefined');
		var keyField = this.fields[this.key];
		if(keyField == null)
			throw new Error(`key field "${this.key}" is not declared`);
	}

	// request to promise
	r2p(request) {
		return new Promise(function(resolve, reject) {
			if('onerror' in request)
				request.onerror = e => reject(e);
			if('onsuccess' in request)
				request.onsuccess = e => resolve(e.target.result);
			if('oncomplete' in request)
				request.oncomplete = e => resolve();
		});
	}

	async exec(mode, f) {
		await this.open();
		var tran = this.db.transaction([this.tableName], mode);
		var store = tran.objectStore(this.tableName);
		var result = await f.call(this, store, tran);
		await this.r2p(tran);
		return result;
	}

	async unrollCursor(req) {
		return new Promise(function(resolve,  reject) {
			var result = [];
			req.onsuccess = function(e) {
				var cursor = e.target.result;
				if(cursor) {
					result.push(cursor.result);
					cursor.continue();
				}
			}
			return result;
		})
	}

	async open() {
		if(this.db != null)
			return;

		var req = indexedDB.open(this.dbName);

		req.onversionchange = e => {
			if(this.db != null) {
				this.db.close();
				this.db = null;
			}
		}

		var upgradePromise = null;
		req.onupgradeneeded = e => {
			var db = e.target.result;
			var keyField = this.fields[this.key];
			if(keyField == null)
				throw new Error('key field not found in fields');
			var objectStore = db.createObjectStore(this.tableName, {
				keyPath: this.key,
				autoIncrement: !!(keyField & Store.fieldTypes.autoIncrement)
			});
			for(let fieldName in this.fields) {
				var field = this.fields[fieldName];
				objectStore.createIndex(fieldName, fieldName, {
					unique: !!(field & Store.fieldTypes.unique),
				});
			}
			upgradePromise = this.r2p(objectStore.transaction);
		};

		var db = await this.r2p(req);

		db.onclose = e => {
			this.db = null;
		};

		if(upgradePromise != null)
			await upgradePromise;
		this.db = db;
	}

	async byKey(key) {
		return await this.exec('readonly', async store => {
			var result = await this.r2p(store.get(key));
			return result.result;
		})
	}

	async fetch() {
		return await this.exec('readonly', store => this.r2p(store.getAll()));
	}

	async byFieldValue(fieldName, value) {
		await this.exec(store => {
			var index = store.index(fieldName);
			var range = IDBKeyRange.only(value);
			var request = index.openCursor(range);
			return this.unrollCursor(request);
		});
	}

	async set(items) {
		if(items == null)
			throw new Error('items is null');
	}

	async insert(item) {
		if(item == null)
			throw new Error('item is null');
		item = this.clone(item);
		this.removeBag(item);
		this.assertValid(item);

		await this.exec('readwrite', async store => {
			item[this.key] = await this.r2p(store.add(item));
		});
		return item;
	}

	async update(item) {
		if(item == null)
			throw new Error('item is null');
		item = this.clone(item);
		this.removeBag(item);
		this.assertValid(item);

		await this.exec('readwrite', store => this.r2p(store.put(item)));
		return item;
	}

	async remove(key) {
		await this.exec('readwrite', store => this.r2p(store.delete(key)));
	}

	async nextKey() {
		if(this._nextKey === null) {
			var items = await this.fetch();
			this._nextKey = items.reduce((r,x) => Math.max(r, x[this.key]), -1);
		}
		return ++this._nextKey;
	}
}


class LocalStore extends Store {
	constructor(options) {
		super(options);
		if(typeof localStorage !== 'object')
			throw new Error('LocalStorage is not supported');

		this.id = options.id;
		if(this.id == null)
			throw new Error('options.id is undefined');
		this._nextKey = null;
	}

	async byKey(key) {
		var items = await this.fetch();
		for(var i = 0; i < items.length; ++i)
			if(items[i][this.key] === key)
				return items[i];
		throw new Error(`item with key ${key} not found`);
	}

	async fetch() {
		var json = localStorage.getItem(this.id);
		var items = JSON.parse(json);
		if(items == null)
			items = [];
		return items;
	}

	async set(items) {
		if(items == null)
			throw new Error('items is null');
		var json = JSON.stringify(items.filter(item => this.isValid(item) === true));
		localStorage.setItem(this.id, json);
	}

	async insert(item) {
		if(item == null)
			throw new Error('item is null');
		item = this.clone(item);
		this.removeBag(item);
		this.assertValid(item);
		var items = await this.fetch();
		items.push(item);
		await this.set(items);
		return item;
	}

	async update(item) {
		if(item == null)
			throw new Error('item is null');
		item = this.clone(item);
		this.removeBag(item);
		this.assertValid(item);
		var items = await this.fetch();
		for(var i = 0; i < items.length; ++i)
			if(items[i][this.key] === item[this.key]) {
				items[i] = item;
				await this.set(items);
				return item;
			}
		throw new Error(`item with key ${item[this.key]} not found`);
	}

	async remove(key) {
		var items = await this.fetch();
		for(var i = 0; i < items.length; ++i)
			if(items[i][this.key] === key) {
				items.splice(i, 1);
				await this.set(items);
				return;
			}
		throw new Error(`item with key ${key} not found`);
	}

	async nextKey() {
		if(this._nextKey === null) {
			var items = await this.fetch();
			this._nextKey = items.reduce((r,x) => Math.max(r, x[this.key]), -1);
		}
		return ++this._nextKey;
	}
}

class ExerciseStore extends LocalStore {
	constructor(store) {
		super({ id: 'exercises' });
		this.store = store;
	}

	async makeNew() {
		var obj = await super.makeNew();
		obj.title = '';
		obj.subtitle = '';
		return obj;
	}

	*validate(item) {
		if(this.isNullOrWhiteSpace(item.title))
			yield 'title is required';
	}

	async remove(key) {
		super.makeNew(key);
		var related = this.store.routineExercises;
		for(let item of related.byExercise(key))
			await related.remove(item);
	}
}

class RoutineStore extends LocalStore {
	constructor(store) {
		super({ id: 'routines' })
		this.store = store;
	}

	async makeNew() {
		var obj = await super.makeNew();
		obj.title = '';
		return obj;
	}

	*validate(item) {
		if(this.isNullOrWhiteSpace(item.title))
			yield 'title is required';
	}

	async remove(key) {
		super.makeNew(key);
		var related = this.store.routineExercises;
		for(let item of related.byRoutine(key))
			await related.remove(item);
	}
}

class RoutineExerciseStore extends LocalStore {
	constructor(store) {
		super({ id: 'routineExercises' })
		this.store = store;
	}

	async makeNew(routineKey) {
		if(routineKey == null || routineKey === undefined)
			throw new Error('routineKey is null');
		var obj = await super.makeNew();
		obj.routineKey = routineKey;
		obj.exerciseKey = null;
		obj.index = null;
		obj.reps = '';
		return obj;
	}

	*validate(item) {
		if(item.routineKey == null)
			yield 'routineKey is null';
		if(item.exerciseKey == null)
			yield 'exerciseKey is null';
		if(item.index == null)
			yield 'index is null';
		if(item.reps == null || item.reps === '')
			yield 'reps is null';
		if(item.reps <= 0)
			yield 'invalid reps';
	}

	async byRoutine(routineKey) {
		if(routineKey == null || routineKey === undefined)
			throw new Error('routineKey is null');
		var items = await this.fetch();
		return items.filter(x => x.routineKey === routineKey);
	}

	async byExercise(exerciseKey) {
		if(exerciseKey == null || exerciseKey === undefined)
			throw new Error('exerciseKey is null');
		var items = await this.fetch();
		return items.filter(x => x.exerciseKey === exerciseKey);
	}
}

class GkStore {
	exercises = new ExerciseStore(this);
	routines = new RoutineStore(this);
	routineExercises = new RoutineExerciseStore(this);
}

export default new GkStore();
export { Store, IndexedDbStore };