/**
 * Index controller
 */


import recipes from "./recipes.js";
import Recipe from "./models/Recipe.js";
import Tag from "./models/Tag.js";
import DomFilter from "./models/DomFilter.js";

/**
 * @module controller
 */
export default {
    /**
     * @property {Array.<Recipe>} recipes 
     */
    recipes: [],

    /**
     * @property {Array.<Recipe>} filteredRecipes 
     */
    filteredRecipes: [],
    
    /**
     * @property {Array.<string>} filterTypes
     */
    filterTypes: ['ingredients', 'appliances', 'ustensils'],
    
    /**
     * @property {Object} tags
     * @property {Array.<string>} ingredients
     * @property {Array.<string>} ustensils
     * @property {Array.<string>} appliances
     */
    tags: {
        ingredients: [],
        ustensils: [],
        appliances: []
    },

    /**
     * @property {Object} tagsClasses
     * @property {<string>} tagsClasses.ingredients
     * @property {<string>} tagsClasses.ustensils
     * @property {<string>} tagsClasses.appliances
     */
    tagsClasses: {
        ingredients: 'primary',
        appliances: 'success',
        ustensils: 'danger',
    },
    
    /**
     * @property {Array.<Tag>} stateTags
     */
    stateTags: [],

    /**
     * @property {(undefined|DomFilter)} stateFilter
     */
    stateFilter: undefined,
    
    /**
     * @property {Object} dom
     * @property {HTMLElement} dom.search
     * @property {HTMLElement} dom.tags
     * @property {Object} dom.filters
     * @property {DomFilter} dom.filters.ingredients
     * @property {DomFilter} dom.filters.appliances
     * @property {DomFilter} dom.filters.ustensils
     * @property {HTMLElement} dom.recipes
     */
    dom: {
        search: document.querySelector('[data-search]'),
        tags: document.querySelector('[data-filter-tags]'),
        filters: {
            ingredients: new DomFilter(document.querySelector('[data-filter="ingredients"]')),
            appliances: new DomFilter(document.querySelector('[data-filter="appliances"]')),
            ustensils: new DomFilter(document.querySelector('[data-filter="ustensils"]')),
        },
        recipes: document.querySelector('[data-recipes]'),
        norecipes: document.querySelector('[data-norecipes]'),
    },

    /**
     * Mount controller
     * @async
     * @returns {void}
     */
    async mount () {
        await this.fetchData();
        this.renderRecipes();
        // Bind
        for (const [, filter] of Object.entries(this.dom.filters)) {
            filter.label.addEventListener('click', (e) => {// Active state
                this.activeIn(filter);
            });
            filter.expand.addEventListener('click', (e) => {// Expand state
                this.toggle(filter);
            });
            filter.input.addEventListener('keyup', this.renderFilter.bind(this));// Filter input change
        }
        this.dom.search.addEventListener('keyup', this.renderRecipes.bind(this));// Search input change
    },

    /**
     * Render Tags
     * @returns {void}
     */
    renderTags () {
        this.dom.tags.innerHTML = '';
        this.stateTags.forEach((tag) => {
            const elTag = tag.renderTag(this.tagsClasses[tag.type]);
            elTag.querySelector('button').addEventListener('click', (e) => this.removeTag(tag));// Remove tag on click
            this.dom.tags.append(elTag);
        });
    },

    /**
     * Render Tags
     * @returns {void}
     */
    renderFilter () {
        if (!this.stateFilter) return;
        const filter = this.stateFilter; // Shortcut
        filter.results.style.display = 'none';
        filter.results.innerHTML = '';// Clean container
        this.tags[filter.name].forEach((item) => {
            const tag = new Tag(item, filter.name)
            if (this.tagIsActive(tag)) return;// Escape active tags
            if (filter.input.value.length > 0 && !tag.name.includes(filter.input.value.toLowerCase())) return;// Escape search result
            const elTag = tag.renderLi();
            elTag.addEventListener('click', (e) => {// Add tag on click
                e.stopPropagation();
                this.addTag(tag);
            });
            filter.results.append(elTag);
        });
        if (filter.results.children.length > 0) filter.results.style.display = '';
    },

    /**
     * Render Recipes
     * @returns {void}
     */
    renderRecipes () {
        this.dom.norecipes.style.display = 'none';
        this.applyFilterRecipes();
        this.dom.recipes.innerHTML = '';
        if (this.dom.search.value.length < 3 && this.stateTags.length == 0) return;
        this.filteredRecipes.forEach((recipe) => {
            this.dom.recipes.append(recipe.render());
        });
        if (this.filteredRecipes.length == 0) this.dom.norecipes.style.display = '';
    },

    /**
     * Set active state
     * @param {DomFilter} filter
     * @returns {void}
     */
    activeIn (filter) {
        if (this.stateFilter) this.activeOut();// Close active filter
        this.stateFilter = filter;// Set active filter
        // Listen click outside
        this.clickOutsideListener = this.clickOutside.bind(this);
        document.addEventListener("click", this.clickOutsideListener);
        // Set visual active state
        filter.container.classList.add('active');
        filter.label.style.display = 'none';
        filter.input.style.display = '';
        filter.input.focus();
        this.renderFilter();
    },

    /**
     * Remove active state
     * @returns {void}
     */
    activeOut () {
        document.removeEventListener("click", this.clickOutsideListener);
        const filter = this.stateFilter;// Shortcut
        // Reset visual active state
        filter.container.classList.remove('active');
        filter.container.classList.remove('expanded');
        filter.label.style.display = '';
        filter.input.style.display = 'none';
        filter.input.value = "";
        filter.results.style.display = 'none';
        // Remove active filter
        this.stateFilter = null;
    },

    /**
     * Toggle expand state
     * @param {DomFilter} filter
     * @returns {void}
     */
    toggle (filter) {
        if (this.stateFilter != filter) this.activeIn(filter);// Not active do it
        // Toggle visual expanded state
        filter.container.classList.toggle('expanded');
        // Focus input on open
        if (filter.container.classList.contains('expanded')) filter.input.focus();
    },

    /**
     * Remove active state when click is outside
     * @param {MouseEvent} e
     * @returns {void}
     */
    clickOutside (e) {
        let clickTarget = e.target;
        do {
            if (clickTarget == this.stateFilter.container) return;
            clickTarget = clickTarget.parentNode;
        } while (clickTarget);
        this.activeOut();
    },

    /**
     * Add tag to active list
     * @param {Tag} tag
     * @returns {void}
     */
    addTag (tag) {
        const id = this.stateTags.findIndex((item) => item.name == tag.name);
        if (id < 0) {
            this.stateTags.push(tag);
            this.renderTags();
            this.renderRecipes();
        }
    },

    /**
     * Remove tag from active list
     * @param {Tag} tag
     * @returns {void}
     */
    removeTag (tag) {
        const id = this.stateTags.findIndex((item) => item.name == tag.name && item.type == tag.type );
        if (id >= 0) {
            this.stateTags.splice(id, 1);
            this.renderTags();
            this.renderRecipes();
        }
    },

    /**
     * Check if a tag is active
     * @param {Tag} tag
     * @returns {boolean}
     */
    tagIsActive (tag) {
        const id = this.stateTags.findIndex((item) => item.name == tag.name && item.type == tag.type );
        if (id >= 0) return true;
        return false;
    },

    /**
     * Apply Recipes filters
     * @returns {Array.<recipe>}
     */
    applyFilterRecipes () {
        let filtered = [];
        if (this.dom.search.value.length < 3) filtered = this.recipes;
        else filtered = this.filterSearch(this.recipes);// Search filter
        this.checkStateTags(filtered);// Clear invalid active tags
        filtered = this.filterTags(filtered);// Tags filter
        this.updateAvailableTags(filtered);
        if (this.stateFilter) this.renderFilter();// Rerender on active
        return this.filteredRecipes = filtered;
    },
    
    /**
     * Remove each invalid active tags
     * @returns {void}
     */
    checkStateTags (filtered) {
        this.updateAvailableTags(filtered);
        const stateTagsLength = this.stateTags.length;
        this.stateTags.forEach((tag, key) => {
            if (!this.tags[tag.type].includes(tag.name)) this.stateTags.splice(key, 1);
        });
        if (stateTagsLength != this.stateTags.length) this.renderTags();// Rerender on change
    },
    
    /**
     * Filter search
     * @param {Array.<Recipe>} recipes
     * @returns {Array.<Recipe>}
     */
    filterSearch(recipes) {
        // Search into name, description, appliance, ingredients name, ustensils
        const term = this.dom.search.value.toLowerCase();
        const filtered = [];
        for (let i = 0; i < recipes.length; i++) {
            const recipe = recipes[i];
            if (recipe.name.includes(term)) filtered.push(recipe);
            else if (recipe.description.toLowerCase().includes(term)) filtered.push(recipe);
            else if (recipe.appliance.includes(term)) filtered.push(recipe);
            else {
                let find = false;
                let ii = 0;
                while (ii < recipe.ingredients.length) {
                    const ingredient = recipe.ingredients[ii].name;
                    if (find = ingredient.includes(term)) {
                        filtered.push(recipe);
                        break;
                    }
                    ii++;
                }
                if (find) continue;
                ii = 0;
                while (ii < recipe.ustensils.length) {
                    const ustensil = recipe.ustensils[ii];
                    if (find = ustensil.includes(term)) {
                        filtered.push(recipe);
                        break;
                    }
                    ii++;
                }
            }
        }
        return filtered;
    },
    
    /**
     * 
     * @param {Array.<Recipe>} recipes 
     */
    filterTags(recipes) {
        this.stateTags.forEach((tag) => {
            recipes = recipes.filter((recipe) => recipe.tagAvailable(tag));
        });
        return recipes;
    },

    /**
     * Update available tags
     * @param {Array.<Recipe>} recipes 
     */
    updateAvailableTags (recipes = this.filteredRecipes) {
        // Reset tags
        this.tags.ingredients = [];
        this.tags.ustensils = [];
        this.tags.appliances = [];
        // Set new tags
        recipes.forEach((recipe) => {
            recipe.ingredients.forEach((ingredient) => {
                if (!this.tags.ingredients.includes(ingredient.name)) this.tags.ingredients.push(ingredient.name);
            });
            recipe.ustensils.forEach((ustensil) => {
                if (!this.tags.ustensils.includes(ustensil)) this.tags.ustensils.push(ustensil);
            });
            if (!this.tags.appliances.includes(recipe.appliance)) this.tags.appliances.push(recipe.appliance);
        });
    },

    /**
     * Fetch and format data from api
     * @async
     * @returns {Promise}
     */
    async fetchData () {
        recipes.forEach((recipe) => this.recipes.push(new Recipe(recipe)));
        return new Promise((resolve) => resolve(''));
    },
}
