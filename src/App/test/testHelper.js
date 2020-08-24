import { fireEvent, waitFor, screen } from "@testing-library/react";

export async function uploadFileAndCompare(component, componentRef, file) {
  const { getByText, getByTestId } = component;

  const blobInput = new Blob([file]);
  const inputFile = new File([blobInput], 'input.txt', { type: 'text/plain' });
  const fileUploader = getByTestId('file-upload');

  fireEvent.change(fileUploader,  { target: { files: [inputFile] } });
  await waitFor(() => screen.getByText(/Change file/i));

  const drawButton = getByText(/Draw/i);
  fireEvent.click(drawButton, { button: 1 });

  return componentRef.current.prepareTextCanvas()
}
