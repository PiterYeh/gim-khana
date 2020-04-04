import React from 'react';
import EditableList from '../Lib/EditableList';
import store from '../Lib/Store';
import { Link } from 'react-router-dom';

export default class extends React.Component {
	routineKey = this.props.match.params.key;

	render() {
		return (
			<EditableList
				itemGetter={() => store.routineExercises.byRoutine(this.routineKey)}
				itemFactory={() => store.routineExercises.makeNew(this.routineKey)}
				itemComponent={Item}
			/>);
		return <h1>heya {this.routineKey}</h1>
	}
}

class Item extends EditableList.Item {
	render() {
		return (
			<div>
				<Link className="btn btn-outline-secondary btn-fa-text">
					<i className="fa fa-crosshairs" />
					{this.context('choose')}
				</Link>
			</div>
		);
	}
}