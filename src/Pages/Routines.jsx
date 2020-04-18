import React from 'react';
import store from '../Lib/Store';
import EditableList from '../Lib/EditableList';
import { Link } from "react-router-dom";

export default () => <EditableList store={store.routines} itemComponent={Routine} />

class Routine extends EditableList.Item {
	render() {
		return (
			<div>
				<input type="text" className="form-control gk-focus-after-create" value={this.state.item.title} name="title" onChange={this.onChange.bind(this)} onBlur={this.update.bind(this)} />
				<div className="text-center gk-btn-group">
					<button className="btn btn-outline-warning btn-sm btn-fa-text mt-1" onClick={() => this.props.cbRemove(this.props.item.key)}>
						<i className="fa fa-trash" />
						{this.context('delete')}
					</button>
					<Link to={`/routines/${this.props.item.key}/config`} className="btn btn-outline-secondary btn-sm btn-fa-text-before mt-1">
						{this.context('go')}
						<i className="fa fa-arrow-right" />
					</Link>
				</div>
			</div>
		);
	}
}