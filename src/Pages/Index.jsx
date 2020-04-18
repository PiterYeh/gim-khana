import React from 'react';
import { context } from '../Translations';
import { Link } from "react-router-dom";

class PageIndex extends React.Component {
  static contextType = context;

  render() {
    return (
      <nav>
        <ul>
          <li>
            <Link to="/exercises">{this.context('titleExercises')}</Link>
          </li>
          <li>
            <Link to="/routines">{this.context('titleMyRoutines')}</Link>
          </li>
        </ul>
      </nav>
    );
  }
}

export default PageIndex;