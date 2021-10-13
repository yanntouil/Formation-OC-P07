









/**
 * @class DomFilter
 * @property {string} name
 * @property {HTMLElement} container
 * @property {HTMLElement} label
 * @property {HTMLElement} input
 * @property {HTMLElement} results
 * @property {HTMLElement} expand
 */
 export default class DomFilter {
    /**
     * @constructor
     * @param {HTMLElement} elFilter 
     */
    constructor(elFilter) {
        this.name = elFilter.dataset.filter;
        this.container = elFilter;
        this.label = elFilter.querySelector('[data-filter-label]');
        this.input = elFilter.querySelector('[data-filter-input]');
        this.results = elFilter.querySelector('[data-filter-results]');
        this.expand = elFilter.querySelector('[data-filter-expand]');
    }
};