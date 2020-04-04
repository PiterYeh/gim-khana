import React from 'react';
import PropTypes from 'prop-types';
import { context } from '../Translations';
import { Store } from './Store';

export default class EditableList extends React.Component {
	static contextType = context;
	static propTypes = {
		store: PropTypes.instanceOf(Store),
		itemGetter: PropTypes.func,
		itemRenderer: PropTypes.func,
		itemComponent: PropTypes.any,
	};

	constructor(props) {
		super(props);
		this.state = {
			items: [],
			loaded: false
		};
		this.itemsToAdd = [];
		this.focusLastInput = false;
		this.itemGetter = props.itemGetter ? props.itemGetter.bind(null) : props.store.fetch.bind(props.store);
		this.itemFactory = props.itemFactory ? props.itemFactory.bind(null) : props.store.makeNew.bind(props.store);
		this.ref = React.createRef();

		this.itemGetter(this.props.store).then(items => {
			this.setState({ items, loaded: true });
		});
	}

	async add() {
		var obj = await this.itemFactory(this.props.store);
		this.itemsToAdd.push(obj.key);
		this.focusLastInput = true;
		this.setState(state => ({
			items: state.items.concat(obj)
		}));
	}

	async remove(key) {
		await this.props.store.remove(key);
		this.setState(state => ({
			items: state.items.filter(x => x.key != key)
		}));
	}

	async update(item) {
		if(!this.props.store.isValid(item))
			return;
		var iToAdd = this.itemsToAdd.indexOf(item.key);
		if(iToAdd != -1) {
			// insert
			var inserted = await this.props.store.insert(item);
			this.itemsToAdd.splice(iToAdd, 1);
			this._updateItem(item, inserted);
		}
		else {
			// update
			var updated = await this.props.store.update(item);
			this._updateItem(item, updated);
		}
	}

	_updateItem(oldItem, newItem) {
		this.setState(state => {
			var items = [...state.items];
			for(var i = 0; i < items.length; ++i)
				if(items[i].key === oldItem.key) {
					items[i] = newItem;
					return { items };
				}
			throw new Error('item not found');
		});
	}

	componentDidUpdate() {
		if(this.focusLastInput) {
			this.focusLastInput = false;
			var elements = this.ref.current.querySelectorAll('.gk-focus-after-create');
			if(elements.length == 0)
				return;
			var element = elements[elements.length-1];
			element.focus();
		}
	}

	render() {
		var renderer = this.props.itemRenderer;
		var Component = this.props.itemComponent;
		return (
			<div className="{this.props.className} gk-fix gk-fix-column editable-list" ref={this.ref}>
				<div className="gk-fix-content editable-list-content">
					{this.state.items.map(item => {
						if(renderer != null)
							return renderer.call(null, item, this)
						else if(Component != null)
							return <Component key={item.key} item={item} cbRemove={this.remove.bind(this)} cbUpdate={this.update.bind(this)} />
						else
							throw new Error('itemRenderer and itemComponent are not defined');
					})}
				</div>
				<div className="gk-fix-fixed gk-btn-bottom">
					<button type="button" className="btn btn-outline-secondary btn-fa-text" onClick={this.add.bind(this)}>
						<i className="fa fa-plus" />
						{this.context('new')}
					</button>
				</div>
			</div>
		);
	}

	static Item = class extends React.Component {
		static contextType = context;
		static propTypes = {
			item: PropTypes.any.isRequired,
			cbRemove: PropTypes.func.isRequired,
			cbUpdate: PropTypes.func.isRequired
		}

		state = {
			item: {...this.props.item}
		}

		onChange(e) {
			var target = e.target;
			this.setState(state => {
				state.item[target.name] = target.value;
				return state;
			});
		}

		update(e) {
			var target = e.target;
			this.setState(state => {
				this.props.cbUpdate(state.item);
				return state;
			});
		}
	}
}