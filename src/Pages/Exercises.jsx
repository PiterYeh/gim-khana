import React from 'react';
import store from '../Lib/Store';
import EditableList from '../Lib/EditableList';

export default () => <EditableList store={store.exercises} itemComponent={Exercise} />;

class Exercise extends EditableList.Item {
	render() {
		return (
			<div className="exercise">
				<input className="form-control gk-focus-after-create" type="text" name="title" placeholder={this.context('exerciseTitle')} value={this.state.item.title} onChange={this.onChange.bind(this)} onBlur={this.update.bind(this)} />
				<input className="form-control form-control-sm mt-1" type="text" name="subtitle" placeholder={this.context('exerciseSubtitle')} value={this.state.item.subtitle} onChange={this.onChange.bind(this)} onBlur={this.update.bind(this)} />
				<div className="text-center">
					<button type="button" className="btn btn-outline-warning btn-fa-text btn-sm mt-1" onClick={() => this.props.cbRemove(this.props.item.key)}>
						<i className="fa fa-trash" />
						{this.context('delete')}
					</button>
				</div>
			</div>
		);
	}
}