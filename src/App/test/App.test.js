import React from 'react';
import 'jest-canvas-mock';
import { render, fireEvent, cleanup, wait } from '@testing-library/react';

import App from '../App';
import { f1, f1Output, f2, f2Output } from './testData';
import { uploadFileAndCompare } from "./testHelper";

jest.setTimeout.Timeout = 10000;

const appRef = React.createRef();

let appComponent, exportButton;

beforeEach(async () => {
  appComponent = render(<App ref={appRef} />);
});

afterEach(async () => {
  await cleanup()
})

describe('Testing export button', () => {
  beforeEach(() => {
    const { getByText } = appComponent;
    exportButton = getByText(/Export/i);
  });

  test('Checks if export button exists', () => {
    expect(exportButton).toBeInTheDocument();
  });

  test('Checks if export button is disabled', () => {
    expect(exportButton).toBeDisabled();
  });
})


describe('Check correctness of draw input/output', () => {
  test('Uploading txt input file and compare it with output for file1', async () => {
    const output = await uploadFileAndCompare(appComponent, appRef, f1);
    expect(output).toBe(f1Output);
    expect(output === f2Output).toBeFalsy();
  });

  test('Uploading txt input file and compare it with output for file2', async () => {
    const output = await uploadFileAndCompare(appComponent, appRef, f2);
    expect(output).toBe(f2Output);
    expect(output === f1Output).toBeFalsy();
  })
});

describe('Testing inputs order', () => {
  test('Changing file and text inputs and make sure lastInput is correct', async () => {
    // uploading file
    await uploadFileAndCompare(appComponent, appRef, f2);

    const { getByPlaceholderText } = appComponent;
    const textarea = getByPlaceholderText('Provide some text');

    // providing text
    fireEvent.change(textarea, { target: { value: 'C 230 100' } });

    expect(appRef.current.state.lastInput).toBe('textInput');
  });
});

describe('Testing components without canvas', () => {
  beforeEach(() => {
    const { getByText } = appComponent;
    exportButton = getByText(/Export/i);
  });

  test('Providing input without canvas command and make sure export is disabled', () => {
    const { getByText, getByPlaceholderText } = appComponent;

    const textarea = getByPlaceholderText('Provide some text');
    fireEvent.change(textarea, { target: { value: 'L 230 100' } });

    const drawButton = getByText(/Draw/i);
    fireEvent.click(drawButton, { button: 1 });

    expect(exportButton).toBeDisabled();
  });

  test('Draw canvas and checks if export button is not disabled', () => {
    const { getByPlaceholderText, getByText } = appComponent;
    const textarea = getByPlaceholderText(/Provide some text/i);
    fireEvent.change(textarea, { target: { value: 'C 230 100' }});

    const drawButton = getByText(/Draw/i);
    fireEvent.click(drawButton, { button: 1 });

    expect(exportButton.getAttribute('disabled')).toBeNull();
  });
});
