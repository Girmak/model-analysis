/**
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

suite('fairness-metric-summary tests', () => {
  const TEST_STEP_TIMEOUT_MS = 100;

  const SLICES = [
    'Overall', 'Slice:1', 'Slice:2', 'Slice:3', 'Slice:4', 'Slice:5', 'Slice:6',
    'Slice:7', 'Slice:8', 'Slice:9', 'Slice:10', 'Slice:11', 'Slice:12',
    'Slice:13', 'Slice:14', 'Slice:15', 'Slice:16'
  ];
  const EXAMPLE_COUNTS = {
    'Overall': 524,
    'Slice:1': 92,
    'Slice:2': 92,
    'Slice:3': 99,
    'Slice:4': 52,
    'Slice:5': 98,
    'Slice:6': 44,
    'Slice:7': 95,
    'Slice:8': 0,
    'Slice:9': 60,
    'Slice:10': 25,
    'Slice:11': 77,
    'Slice:12': 52,
    'Slice:13': 87,
    'Slice:14': 47,
    'Slice:15': 54,
    'Slice:16': 44
  };
  const DOUBLE_VALUE_DATA = SLICES.map((slice) => {
    return {
      'slice': slice,
      'sliceValue': slice.split(':')[1] || 'Overall',
      'metrics': {
        'accuracy': 0.2,
        'post_export_metrics/false_negative_rate@0.30': NaN,
        'post_export_metrics/false_negative_rate@0.50': 0.5,
        'post_export_metrics/false_negative_rate@0.70': 0.8
      }
    };
  });
  const DOUBLE_VALUE_DATA_COMPARE = SLICES.map((slice) => {
    return {
      'slice': slice,
      'sliceValue': slice.split(':')[1] || 'Overall',
      'metrics': {
        'accuracy': 0.3,
        'post_export_metrics/false_negative_rate@0.30': NaN,
        'post_export_metrics/false_negative_rate@0.50': 0.5,
        'post_export_metrics/false_negative_rate@0.70': 0.8
      }
    };
  });
  const BOUNDED_VALUE_DATA = SLICES.map((slice) => {
    return {
      'slice': slice,
      'sliceValue': slice.split(':')[1] || 'Overall',
      'metrics': {
        'accuracy': {
          'lowerBound': 0.3,
          'upperBound': 0.5,
          'value': 0.4,
          'methodology': 'POISSON_BOOTSTRAP'
        },
        'post_export_metrics/false_negative_rate@0.30': {
          'lowerBound': NaN,
          'upperBound': NaN,
          'value': NaN,
          'methodology': 'POISSON_BOOTSTRAP'
        },
        'post_export_metrics/false_negative_rate@0.50': {
          'lowerBound': 0.2,
          'upperBound': 0.4,
          'value': 0.3,
          'methodology': 'POISSON_BOOTSTRAP'
        },
        'post_export_metrics/false_negative_rate@0.70': {
          'lowerBound': 0.2,
          'upperBound': 0.4,
          'value': 0.3,
          'methodology': 'POISSON_BOOTSTRAP'
        },
        'post_export_metrics/example_count': EXAMPLE_COUNTS[slice],
      }
    };
  });

  // The default number and max number of slices to plot, not including
  // baseline.
  const DEFAULT_NUM_OF_SLICES_TO_PLOT = 9;
  const DEFAULT_NUM_OF_SLICES_TO_PLOT_EVAL_COMPARE = 3;

  let metricSummary;

  const setUpAndCheck = (setUpCallback, checkCallback) => {
    setUpCallback();
    setTimeout(checkCallback, 1);
  };

  const queryElement = (tag) => {
    let element = metricSummary.querySelectorAll(tag);
    if (!element.length) {
      // To find the dom for polymer 2.
      element = metricSummary.shadowRoot.querySelectorAll(tag);
    }
    return element;
  };

  test('PropertiesValueCheckForBoundedValue', done => {
    metricSummary = fixture('main');

    const fillBoundedValue = () => {
      metricSummary.slices = SLICES;
      metricSummary.data = BOUNDED_VALUE_DATA;
      metricSummary.metric = 'post_export_metrics/false_negative_rate';
      metricSummary.baseline = 'Overall';
    };

    const clickThreshold = () => {
      let thresholdsList = metricSummary.$['thresholdsList'];
      thresholdsList.selectIndex(2);
      thresholdsList.selectIndex(0);
      setTimeout(checkValue, TEST_STEP_TIMEOUT_MS);
    };

    const checkValue = () => {
      // Thresholds should be sorted.
      assert.deepEqual(metricSummary.thresholds_, ['0.30', '0.50', '0.70']);
      assert.deepEqual(
          metricSummary.$['metric-header'].innerText.trim(),
          'post_export_metrics/false_negative_rate');
      assert.deepEqual(metricSummary.$['table'].metrics, [
        'post_export_metrics/false_negative_rate@0.30',
        'post_export_metrics/false_negative_rate@0.30 against Overall',
        'post_export_metrics/false_negative_rate@0.50',
        'post_export_metrics/false_negative_rate@0.50 against Overall',
        'post_export_metrics/false_negative_rate@0.70',
        'post_export_metrics/false_negative_rate@0.70 against Overall'
      ]);

      assert.deepEqual(metricSummary.$['bar-chart'].metrics, [
        'post_export_metrics/false_negative_rate@0.30',
        'post_export_metrics/false_negative_rate@0.50',
        'post_export_metrics/false_negative_rate@0.70'
      ]);
      assert.deepEqual(
          metricSummary.$['bar-chart'].slices,
          SLICES.slice(1, DEFAULT_NUM_OF_SLICES_TO_PLOT));
      assert.deepEqual(metricSummary.$['bar-chart'].baseline, 'Overall');
      assert.deepEqual(metricSummary.$['bar-chart'].data, BOUNDED_VALUE_DATA);
      assert.deepEqual(
          metricSummary.computeExampleCounts_(
              'Overall', BOUNDED_VALUE_DATA,
              ['Slice:15', 'Slice:7', 'Slice:4']),
          [524, 54, 95, 52]);
      done();
    };
    setUpAndCheck(fillBoundedValue, clickThreshold);
  });

  test('PropertiesValueCheckForDoubleValue', done => {
    metricSummary = fixture('main');

    const fillDoubleValue = () => {
      metricSummary.slices = SLICES;
      metricSummary.data = DOUBLE_VALUE_DATA;
      metricSummary.metric = 'accuracy';
      metricSummary.baseline = 'Overall';
    };

    const checkValue = () => {
      assert.deepEqual(
          metricSummary.$['metric-header'].innerText.trim(), 'accuracy');
      assert.deepEqual(
          metricSummary.$['table'].metrics,
          ['accuracy', 'accuracy against Overall']);

      assert.deepEqual(metricSummary.$['bar-chart'].metrics, ['accuracy']);
      assert.deepEqual(
          metricSummary.$['bar-chart'].slices,
          SLICES.slice(1, DEFAULT_NUM_OF_SLICES_TO_PLOT));
      assert.deepEqual(metricSummary.$['bar-chart'].baseline, 'Overall');
      assert.deepEqual(metricSummary.$['bar-chart'].data, DOUBLE_VALUE_DATA);
      assert.deepEqual(
          metricSummary.computeExampleCounts_(
              'Overall', BOUNDED_VALUE_DATA,
              ['Slice:15', 'Slice:7', 'Slice:4']),
          [524, 54, 95, 52]);
      done();
    };
    setUpAndCheck(fillDoubleValue, checkValue);
  });

  test('PropertiesValueCheckForDataCompare', done => {
    metricSummary = fixture('main');

    const fillBothValues = () => {
      metricSummary.slices = SLICES;
      metricSummary.data = BOUNDED_VALUE_DATA;
      metricSummary.dataCompare = DOUBLE_VALUE_DATA;
      metricSummary.metric = 'accuracy';
      metricSummary.baseline = 'Overall';
    };

    const checkValue = () => {
      assert.deepEqual(
          metricSummary.$['metric-header'].innerText.trim(), 'accuracy');
      assert.deepEqual(
          metricSummary.$['table'].metrics,
          ['accuracy', 'accuracy against Overall']);

      assert.deepEqual(metricSummary.$['bar-chart'].metrics, ['accuracy']);
      assert.deepEqual(
          metricSummary.$['bar-chart'].slices,
          SLICES.slice(1, DEFAULT_NUM_OF_SLICES_TO_PLOT_EVAL_COMPARE));
      assert.deepEqual(metricSummary.$['bar-chart'].baseline, 'Overall');
      assert.deepEqual(metricSummary.$['bar-chart'].data, BOUNDED_VALUE_DATA);
      assert.deepEqual(
          metricSummary.$['bar-chart'].dataCompare, DOUBLE_VALUE_DATA);
      assert.deepEqual(
          metricSummary.computeExampleCounts_(
              'Overall', BOUNDED_VALUE_DATA,
              ['Slice:15', 'Slice:7', 'Slice:4']),
          [524, 54, 95, 52]);
      done();
    };
    setUpAndCheck(fillBothValues, checkValue);
  });

  test('ChooseDifferentSlices', done => {
    metricSummary = fixture('main');

    const fillData = () => {
      metricSummary.data = DOUBLE_VALUE_DATA;
      metricSummary.slices = SLICES;
      metricSummary.metric = 'accuracy';
      metricSummary.baseline = 'Overall';
    };

    const checkDefaultSelectedSlicesBeforeOpenDropDown = () => {
      assert.deepEqual(
          metricSummary.$['bar-chart'].slices,
          SLICES.slice(1, DEFAULT_NUM_OF_SLICES_TO_PLOT));
      setTimeout(openSlicesDropDownMenu, TEST_STEP_TIMEOUT_MS);
    };

    const openSlicesDropDownMenu = () => {
      const button = queryElement('paper-button')[0];
      button.fire('tap');
      setTimeout(selectSlices, TEST_STEP_TIMEOUT_MS);
    };

    const selectSlices = () => {
      const sliceDropDown = queryElement('paper-listbox')[0];

      // The number of paper items is
      // "SLICES.length + 1", because there is a addtional slice key line.
      assert.deepEqual(sliceDropDown.items.length, SLICES.length + 1);

      // Check the default selected slices text.
      assert.deepEqual(
          sliceDropDown.selectedItems.map(item => item.slice.text),
          ['Overall', '1', '2', '3', '4', '5', '6', '7', '8']);

      // Click "Slice" row. This will cause all slices under this slice key
      // selected.
      sliceDropDown.items[1].fire('tap');
      setTimeout(checkSlicesSelection, TEST_STEP_TIMEOUT_MS);
    };

    const checkSlicesSelection = () => {
      let sliceDropDown = queryElement('paper-listbox')[0];
      // Check selected slices text after updating.
      assert.deepEqual(
          sliceDropDown.selectedItems.map(item => item.slice['text']), [
            'Overall', '1', '2', '3', '4', '5', '6', '7', '8', 'Slice', '9',
            '10', '11', '12', '13', '14', '15', '16'
          ]);

      // Click "Slice" row again. This will cause all slices under this slice
      // key unselected.
      sliceDropDown.items[1].fire('tap');
      setTimeout(checkSlicesUnselection, TEST_STEP_TIMEOUT_MS);
    };

    const checkSlicesUnselection = () => {
      let sliceDropDown = queryElement('paper-listbox')[0];
      // Check selected slices text after updating.
      assert.deepEqual(
          sliceDropDown.selectedItems.map(item => item.slice['text']), [
            'Overall',
          ]);
      done();
    };

    setUpAndCheck(fillData, checkDefaultSelectedSlicesBeforeOpenDropDown);
  });

  test('MetricsForBarChart', done => {
    metricSummary = fixture('main');

    const fillData = () => {
      metricSummary.metric = 'post_export_metrics/false_negative_rate';
      metricSummary.slices = SLICES.slice(0, 2);
      metricSummary.baseline = 'Overall';
      metricSummary.data = DOUBLE_VALUE_DATA.slice(0, 2);
    };

    const CheckProperties = () => {
      assert.deepEqual(
          metricSummary.$['bar-chart'].metrics,
          ['post_export_metrics/false_negative_rate@0.50']);
      done();
    };

    setUpAndCheck(fillData, CheckProperties);
  });

  test('SlicesForBarChart', done => {
    metricSummary = fixture('main');

    const fillData = () => {
      metricSummary.metric = 'accuracy';
      metricSummary.baseline = 'Overall';
      metricSummary.slices = SLICES;
      metricSummary.data = DOUBLE_VALUE_DATA;
    };

    const CheckProperties = () => {
      // Only select up to 9 slices.
      assert.deepEqual(
          metricSummary.$['bar-chart'].slices,
          SLICES.slice(1, DEFAULT_NUM_OF_SLICES_TO_PLOT));
      done();
    };
    setUpAndCheck(fillData, CheckProperties);
  });

  test('TableData', done => {
    metricSummary = fixture('main');

    const fillData = () => {
      metricSummary.metric = 'accuracy';
      metricSummary.baseline = 'Overall';
      metricSummary.slices = SLICES.slice(0, 3);
      metricSummary.data = DOUBLE_VALUE_DATA.slice(0, 3);
      metricSummary.dataCompare = DOUBLE_VALUE_DATA_COMPARE.slice(0, 3);
    };

    const CheckProperties = () => {
      const expected_data = [
        {'slice': 'Overall', 'metrics': {'accuracy': 0.2}},
        {'slice': 'Slice:1', 'metrics': {'accuracy': 0.2}},
        {'slice': 'Slice:2', 'metrics': {'accuracy': 0.2}}
      ];
      const expected_data_compare = [
        {'slice': 'Overall', 'metrics': {'accuracy': 0.3}},
        {'slice': 'Slice:1', 'metrics': {'accuracy': 0.3}},
        {'slice': 'Slice:2', 'metrics': {'accuracy': 0.3}}
      ];

      assert.equal(metricSummary.$['table'].data.length, expected_data.length);
      for (var i = 0; i < 3; i++) {
        const actualVal = metricSummary.$['table'].data[i];
        const expectedVal = expected_data[i];
        assert.deepEqual(Object.keys(actualVal), Object.keys(expectedVal));
        assert.equal(actualVal['slice'], expectedVal['slice']);
        assert.equal(
            actualVal['metrics']['accuracy'],
            expectedVal['metrics']['accuracy']);

        const actualCompareVal = metricSummary.$['table'].dataCompare[i];
        const expectedCompareVal = expected_data_compare[i];
        assert.deepEqual(
            Object.keys(actualCompareVal), Object.keys(expectedCompareVal));
        assert.equal(actualCompareVal['slice'], expectedCompareVal['slice']);
        assert.equal(
            actualCompareVal['metrics']['accuracy'],
            expectedCompareVal['metrics']['accuracy']);
      }
      done();
    };
    setUpAndCheck(fillData, CheckProperties);
  });
});
