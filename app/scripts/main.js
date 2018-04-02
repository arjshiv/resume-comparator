/*!
 *
 *  Web Starter Kit
 *  Copyright 2015 Google Inc. All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License
 *
 */
/* eslint-env browser */
/* globals _, britecharts, d3 */
(function () {
  'use strict';

  // Check to make sure service workers are supported in the current browser,
  // and that the current page is accessed from a secure origin. Using a
  // service worker from an insecure origin will trigger JS console errors. See
  // http://www.chromium.org/Home/chromium-security/prefer-secure-origins-for-powerful-new-features
  var isLocalhost = Boolean(window.location.hostname === 'localhost' ||
    // [::1] is the IPv6 localhost address.
    window.location.hostname === '[::1]' ||
    // 127.0.0.1/8 is considered localhost for IPv4.
    window.location.hostname.match(
      /^127(?:\.(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)){3}$/
    )
  );

  if ('serviceWorker' in navigator &&
    (window.location.protocol === 'https:' || isLocalhost)) {
    navigator.serviceWorker.register('service-worker.js')
      .then(function (registration) {
        // updatefound is fired if service-worker.js changes.
        registration.onupdatefound = function () {
          // updatefound is also fired the very first time the SW is installed,
          // and there's no need to prompt for a reload at that point.
          // So check here to see if the page is already controlled,
          // i.e. whether there's an existing service worker.
          if (navigator.serviceWorker.controller) {
            // The updatefound event implies that registration.installing is set:
            // https://slightlyoff.github.io/ServiceWorker/spec/service_worker/index.html#service-worker-container-updatefound-event
            var installingWorker = registration.installing;

            installingWorker.onstatechange = function () {
              switch (installingWorker.state) {
                case 'installed':
                  // At this point, the old content will have been purged and the
                  // fresh content will have been added to the cache.
                  // It's the perfect time to display a "New content is
                  // available; please refresh." message in the page's interface.
                  break;

                case 'redundant':
                  throw new Error('The installing ' +
                    'service worker became redundant.');

                default:
                // Ignore
              }
            };
          }
        };
      }).catch(function (e) {
      console.error('Error during service worker registration:', e);
    });
  }

  function normalize(text) {
    const ARTICLES = { a: 1, an: 1, the: 1 };
    return text
      .split(/\s+/)
      .map(x => x.toLowerCase())
      .filter(x => !ARTICLES[x]);
  }

  function compareNormalized(target, current, limit = 10) {
    const currentFrequencies = current
      .reduce((all, word) =>{
        all[word] = (all[word] || 0) + 1;
        return all;
      }, {});

    const differences = target
      .reduce((diffs, word) =>{
        if (!currentFrequencies[word]) {
          diffs[word] = (diffs[word] || 0) + 1;
        }
        return diffs;
      }, {});

    return Object.keys(differences)
      .reduce((diffCounter, key) =>{
        diffCounter.push([key, differences[key]]);
        return diffCounter;
      }, [])
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit);
  }

  function generateTable(element, results) {
    const tbody = results.map(r => `<tr>
              <td class="mdl-data-table__cell--non-numeric">${r[0]}</td>
              <td>${r[1]}</td>
            </tr>`)
      .join('');
    const table = `
    <table class="mdl-data-table mdl-js-data-table mdl-data-table--selectable mdl-shadow--2dp">
      <thead>
        <tr>
          <th class="mdl-data-table__cell--non-numeric">Word</th>
          <th>Frequency</th>
        </tr>
      </thead>
      <tbody>
        ${tbody}
      </tbody>
    </table>
    `;
    element.innerHTML = table;
  }

  function generateChart(id, results) {
    const data = results.map(r => ({
      name: r[0],
      value: r[1]
    }));
    let barChart = new britecharts.bar();
    let chartTooltip = new britecharts.miniTooltip();
    let margin = {
      left: 120,
      right: 20,
      top: 20,
      bottom: 30
    };
    let barContainer = d3.select(id);
    let tooltipContainer;

    barChart
      .margin(margin)
      .width(300)
      .height(300)
      .enableLabels(true)
      .colorSchema(britecharts.colors.colorSchemas.britecharts)
      .on('customMouseOver', chartTooltip.show)
      .on('customMouseMove', chartTooltip.update)
      .on('customMouseOut', chartTooltip.hide);

    barContainer.datum(data).call(barChart);

    tooltipContainer = d3.select('.bar-chart .metadata-group');
    tooltipContainer.datum([]).call(chartTooltip);
  }

  // Your custom JavaScript goes here
  function compareTexts() {
    const jobDesc = document.getElementById('jobdesc').value;
    const resume = document.getElementById('resume').value;
    if (!jobDesc || !resume) {
      return;
    }
    window.ResumeComparator.results = compareNormalized(normalize(jobDesc), normalize(resume));
    generateTable(document.getElementById('stats-table'), window.ResumeComparator.results);
    generateChart('#stats-chart', window.ResumeComparator.results);
  }

  window.ResumeComparator = window.ResumeComparator || {};
  window.ResumeComparator.compareTexts = compareTexts;

  document.getElementById('calculate').addEventListener('click', compareTexts);

})();
