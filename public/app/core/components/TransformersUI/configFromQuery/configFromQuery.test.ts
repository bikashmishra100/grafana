import { toDataFrame, FieldType, ReducerID } from '@grafana/data';
import { extractConfigFromQuery, ConfigFromQueryTransformOptions } from './configFromQuery';

describe('config from data', () => {
  const config = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: [1, 2] },
      { name: 'Max', type: FieldType.string, values: [1, 10, 50] },
      { name: 'Min', type: FieldType.string, values: [1, 10, 5] },
      { name: 'Names', type: FieldType.string, values: ['first-name', 'middle', 'last-name'] },
    ],
    refId: 'A',
  });

  const seriesA = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: [1, 2, 3] },
      {
        name: 'Value',
        type: FieldType.number,
        values: [2, 3, 4],
        config: { displayName: 'SeriesA' },
      },
    ],
  });

  it('Select and apply with two frames and default mappings and reducer', () => {
    const options: ConfigFromQueryTransformOptions = {
      configRefId: 'A',
      mappings: [],
    };

    const results = extractConfigFromQuery(options, [config, seriesA]);
    expect(results.length).toBe(1);
    expect(results[0].fields[1].config.max).toBe(50);
    expect(results[0].fields[1].config.min).toBe(5);
  });

  it('With custom mappings', () => {
    const options: ConfigFromQueryTransformOptions = {
      configRefId: 'A',
      mappings: [{ fieldName: 'Min', configProperty: 'decimals' }],
    };

    const results = extractConfigFromQuery(options, [config, seriesA]);
    expect(results.length).toBe(1);
    expect(results[0].fields[1].config.decimals).toBe(5);
  });

  it('With custom reducer', () => {
    const options: ConfigFromQueryTransformOptions = {
      configRefId: 'A',
      mappings: [{ fieldName: 'Max', configProperty: 'max', reducerId: ReducerID.min }],
    };

    const results = extractConfigFromQuery(options, [config, seriesA]);
    expect(results.length).toBe(1);
    expect(results[0].fields[1].config.max).toBe(1);
  });

  it('With custom matcher and displayName mapping', () => {
    const options: ConfigFromQueryTransformOptions = {
      configRefId: 'A',
      mappings: [{ fieldName: 'Names', configProperty: 'displayName', reducerId: ReducerID.first }],
      applyTo: { id: 'byName', options: 'Value' },
    };

    const results = extractConfigFromQuery(options, [config, seriesA]);
    expect(results.length).toBe(1);
    expect(results[0].fields[1].config.displayName).toBe('first-name');
  });
});

describe('value mapping from data', () => {
  const config = toDataFrame({
    fields: [
      { name: 'value', type: FieldType.number, values: [1, 2, 3] },
      { name: 'text', type: FieldType.string, values: ['one', 'two', 'three'] },
      { name: 'color', type: FieldType.string, values: ['red', 'blue', 'green'] },
    ],
    refId: 'config',
  });

  const seriesA = toDataFrame({
    fields: [
      { name: 'Time', type: FieldType.time, values: [1, 2, 3] },
      {
        name: 'Value',
        type: FieldType.number,
        values: [1, 2, 3],
        config: {},
      },
    ],
  });

  it('Should take all field values and map to value mappings', () => {
    const options: ConfigFromQueryTransformOptions = {
      configRefId: 'config',
      mappings: [
        { fieldName: 'value', configProperty: 'mappings.value' },
        { fieldName: 'color', configProperty: 'mappings.color' },
        { fieldName: 'text', configProperty: 'mappings.text' },
      ],
    };

    const results = extractConfigFromQuery(options, [config, seriesA]);
    expect(results[0].fields[1].config.mappings).toMatchInlineSnapshot(`
      Array [
        Object {
          "options": Object {
            "1": Object {
              "color": "red",
              "index": 0,
              "text": "one",
            },
            "2": Object {
              "color": "blue",
              "index": 1,
              "text": "two",
            },
            "3": Object {
              "color": "green",
              "index": 2,
              "text": "three",
            },
          },
          "type": "value",
        },
      ]
    `);
  });
});
