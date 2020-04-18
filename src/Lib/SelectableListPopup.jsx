import React from 'react';
import SelectableList from './SelectableList';
import Popup from './Popup';

export default class extends React.Component {
	render() {
		return (
			<Popup
				title={this.props.title}
				promise={this.props.promise}
				visible={this.props.visible}
				contentComponent={() => (
					<SelectableList
						promise={this.props.promise}
						itemComponent={this.props.itemComponent}
						itemGetter={this.props.itemGetter}
					/>)}
			/>
		);
	}
}