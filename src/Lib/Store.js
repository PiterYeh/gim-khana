class Store {
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
		this.assertValid(item);
		var items = await this.fetch();
		items.push(item);
		await this.set(items);
		return item;
	}

	async update(item) {
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
}

class RoutineStore extends LocalStore {
	async makeNew() {
		var obj = await super.makeNew();
		obj.title = '';
		return obj;
	}

	*validate(item) {
		if(this.isNullOrWhiteSpace(item.title))
			yield 'title is required';
	}
}

class RoutineExerciseStore extends LocalStore {
	async makeNew(routineKey) {
		if(routineKey == null || routineKey === undefined)
			throw new Error('routineKey is null');
		var obj = await super.makeNew();
		obj.routineKey = routineKey;
		obj.title = '';
		return obj;
	}

	*validate(item) {
		if(item.routineKey == null)
			yield 'routineKey is null';
		if(item.exerciseKey == null)
			yield 'exerciseKey is null';
		if(item.index == null)
			yield 'index is null';
	}

	async byRoutine(routineKey) {
		if(routineKey == null || routineKey === undefined)
			throw new Error('routineKey is null');
		var items = await this.fetch();
		return items.filter(x => x.routineKey === routineKey);
	}
}

class GkStore {
	constructor() {
		this.exercises = new ExerciseStore({ id: 'exercises' });
		this.routines = new RoutineStore({ id: 'routines' });
		this.routineExercises = new RoutineExerciseStore({ id: 'routineExercises' });
	}
}

export default new GkStore();
export { Store };