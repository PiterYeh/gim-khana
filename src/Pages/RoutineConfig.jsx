import React from 'react';
import EditableList from '../Lib/EditableList';
import SelectableListPopup from '../Lib/SelectableListPopup';
import { openPopupAsync } from '../Lib/Popup';
import store from '../Lib/Store';
import { context } from '../Translations';

export default class extends React.Component {
	static contextType = context;

	routineKey = this.props.match.params.key;
	state = {}

	render() {
		return <>
				<EditableList
					store={store.routineExercises}
					itemGetter={this.itemGetter.bind(this)}
					itemFactory={this.itemFactory.bind(this)}
					itemComponent={Item}
				/>
				<SelectableListPopup
					title={this.context('pickExercise')}
					visible={this.state.popupVisible}
					promise={this.state.popupPromise}
					itemGetter={() => store.exercises.fetch()}
					itemComponent={(props) =>
						<>
							<div>
								<strong>{props.item.title}</strong>
							</div>
							<small>
								{props.item.subtitle}
							</small>
						</>
					}
				/>
			</>
	}

	async itemGetter() {
		var items = await store.routineExercises.byRoutine(this.routineKey);
		var exercises = await store.exercises.fetch();
		for(let item of items)
			item._bag = { item: exercises.find(x => x.key === item.exerciseKey) || {} };
		return items;
	}

	async itemFactory(store, list) {
		var exercise = await openPopupAsync(this);
		if(exercise == null)
			return null;
		var item = await store.makeNew(this.routineKey)
		item.exerciseKey = exercise.key;
		item.index = list.length;
		item.mode = 'count';
		item._bag = { item: exercise };
		return item;
	}
}

class Item extends EditableList.Item {
	state = {
		item: this.props.item
	}

	setMode(mode) {
		this.setProperty('mode', mode);
		this.update();
	}

	render() {
		return (
			<div style={{ position: 'relative' }}>
				<div style={{ position: 'absolute', bottom: 10, left: 7 }}>
					<span className="badge badge-pill badge-secondary">
						{this.props.index + 1}
					</span>
				</div>
				<div className="text-center mb-2">
					<strong>
						{this.props.item._bag.item.title}
					</strong>
					{
						this.props.item._bag.item.subtitle ?
						<small> - {this.props.item._bag.item.subtitle}</small> :
						null
					}
				</div>

				<div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
					<div style={{flex: '1 1 0'}}>
						<div className="btn-group-vertical btn-group-sm">
							<button type="button" className={"btn btn-outline-primary btn-fa-text " + (this.state.item.mode === 'count' ? 'active' : '')} onClick={this.setMode.bind(this, 'count')}>
								<i className="fa fa-redo-alt" />
								{this.context('repCount')}
							</button>
							<button type="button" className={"btn btn-outline-primary btn-fa-text " + (this.state.item.mode === 'time' ? 'active' : '')} onClick={this.setMode.bind(this, 'time')}>
								<i className="fa fa-stopwatch" />
								{this.context('repTime')}
							</button>
						</div>
					</div>
					<div style={{flex: '1 1 0'}}>
						<div className="input-group input-group-sm">
							<input type="number" className="form-control gk-focus-after-create" name="reps" value={this.state.item.reps} onChange={this.onChange.bind(this)} onBlur={this.update.bind(this)} />
							<div className="input-group-append">
								<span className="input-group-text">
									{this.state.item.mode === 'time' ? this.context('repTimeUnit') : this.context('repCountUnit')}
								</span>
							</div>
						</div>
					</div>
				</div>

				<div style={{marginTop: 15, textAlign: 'center'}}>
					<button type="button" tabIndex="-1" className="btn btn-sm btn-outline-secondary btn-fa-text pull-right" onClick={() => this.props.cbRemove(this.props.item.key)}>
						<i className="fa fa-trash" />
						{this.context('delete')}
					</button>
				</div>
			</div>
		);
	}
}