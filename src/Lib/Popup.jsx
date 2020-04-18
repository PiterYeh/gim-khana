import React from 'react';
import GkPromise from './GkPromise';

export { openPopupAsync }

export default class extends React.Component {
	render() {
		if(!this.props.visible)
			return null;
		var Component = this.props.contentComponent;
		var Footer = this.props.footerComponent;
		if(Component == null) {
			console.error('Popup contentComponent is null');
			return null;
		}
		return (
			<div className="gk-popup">
				<div className="card">
					<div className="card-header">
						{this.props.title}
						<button type="button" className="close" onClick={() => this.props.promise.resolve(null)}>
							<span>&times;</span>
						</button>
					</div>
					<div className="card-body">
						<Component promise={this.props.promise} />
					</div>
					{Footer != null ? <Footer /> : null}
				</div>
			</div>
		);
	}
}

async function openPopupAsync(component) {
	var promise = new GkPromise();
	component.setState({
		popupVisible: true,
		popupPromise: promise
	});
	try {
		return await promise;
	}
	finally {
		component.setState({
			popupVisible: false,
			popupPromise: null
		});
	}
}