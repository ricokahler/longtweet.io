import React from 'react';
import App from '../components/app';
import { render } from 'react-dom';
import 'normalize.css';
import '../components/app.css';

render(<App />, document.querySelector('#root')!);
