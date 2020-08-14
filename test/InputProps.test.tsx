import React from 'react';
import * as ReactDOM from 'react-dom';
import { InputPropsStory } from '../stories/InputProps.stories';

describe('InputProps', () => {
  it('renders without crashing', () => {
    const div = document.createElement('div');
    ReactDOM.render(<InputPropsStory />, div);
    ReactDOM.unmountComponentAtNode(div);
  });
});
