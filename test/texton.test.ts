/**
 * @jest-environment jsdom
 */
import {XDocument, XSelection} from '../src/texton';
import {StringUtils} from '../src/StringUtils';

describe('XDocument', () => {
  let doc!: XDocument;
  // let fetchMock: any = null;
  beforeEach(() => {
    // Jest uses jsdom as the default test environment which emulates
    // a browser and provides a document object for the unit tests.
    // Initialize the document body with the HTML needed for the tests
    document.body.innerHTML += `
      haha
      <div id='body'>
        this is a test
        <span>this is a test</span>
        this is a test<br>
        this is a test
        <p> this is a test </p>
        this is a test
      </div>
    `;
    const body = document.querySelector('#body');
    doc = XDocument.from(body!);

    // Create a mock for fetch and provide a mock implementation
    // so the unit tests aren't actually making network requests
    // fetchMock = jest.spyOn(global, 'fetch');
    // fetchMock.mockImplementation(() => Promise.resolve({
    //   json: () => Promise.resolve({message: 'Your account was created'})
    // }));
  });

  afterEach(() => {
    // After each test call mockRestore() to restore the original functions
    // fetchMock!.mockRestore();
    // resetModules() resets the module registry in Jest and ensures
    // a fresh copy of './code' executes on require()
    jest.resetModules();
  });

  test('XDocument is correctly constructed', () => {
    expect(doc.nodes).toBe(6);
    expect(doc.text).toEqual('thisisatestthisisatestthisisatestthisisatestthisisatestthisisatest');
    for (const node of doc.nodes) {
      expect(node.data.trim()).toEqual('this is a test');
    }
  });

  test('XDocument.select("not exist") is null', () => {
    const selection: XSelection | null = doc.select('not exist');
    expect(selection).toBeNull();
  });

  test('XDocument.select("test this is", 1)', () => {
    const selection: XSelection | null = doc.select('test this i', 1);
    expect(selection).not.toBeNull();
    expect(selection!.getContent(true)).toBe('testthisis');
    const occurrence = selection!.getText();
    expect(occurrence.nth).toBe(1);
    let nodes = selection!.getTextNodes();
    expect(nodes.length).toBe(2);
    expect(nodes[0].data).toEqual('test');
    expect(nodes[1].data).toEqual('this i');
    expect(doc.nodes.length).toEqual(7);
  });
});
