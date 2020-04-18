import React from 'react';

class Nav extends React.Component {
	state = {
		path: '/'
	}
	route = null

	render() {
		var route = this.getRouteConfig(this.state.path);
		if(route == null) {
			console.warn('No route found for this path', this.state.path);
			return;
		}
		var Component = route.component;
		<Component nav={this.getRemote()} />
	}

	getRemote() {
		return {
			route: this.route
		};
	}

	getRouteConfig(path) {
		for(let route of this.params.routes) {
			var match = this.matchRoute(route);
			if(match.success)
				return match;
		}
		return null;
	}

	matchRoute(route, path) {
		var pathTokens = path.split('/').filter(x => x !== '');
		var routeTokens = route.split('/').filter(x => x !== '');
		if(pathTokens.length != routeTokens.length)
			return { success: false };
		let routeValues = {};
		for(let i = 0; i < pathTokens.length; ++i) {
			var pathToken = pathTokens[i];
			var routeToken = routeTokens[i];
			if(routeToken[0] === ':') {
				// parameter
				routeValues[routeToken] = pathToken;
			}
			else {
				// constant value
				if(pathToken.toLowerCase() !== routeToken.toLowerCase())
					return { success: false };
			}
		}
		return {
			success: true,
			routeValues,
			route: route,
			path: path
		}
	}
}