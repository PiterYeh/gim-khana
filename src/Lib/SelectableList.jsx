import React from 'react';

export default class extends React.Component {
	state = {
		items: []
	}

	constructor(props) {
		super(props);
		this.load();
	}

	async load() {
		var items = await this.props.itemGetter.call(null);
		this.setState({ items });
	}

	render() {
		var Item = this.props.itemComponent;
		return (
			<div className="list-group">
				{this.state.items.map((x, i) => {
					return (
						<button type="button" className="list-group-item text-left" key={x.key} onClick={() => this.props.promise.resolve(x)}>
							<Item item={x} index={i} />
						</button>
					);
				})}
			</div>
		);
	}
}
