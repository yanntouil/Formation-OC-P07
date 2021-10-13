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
     * @property {Array.<string>} ingredients  
     */
    ingredients: [],
    
    /**
     * @property {Array.<string>} ustensils
     */
    ustensils: [],
    
    /**
     * @property {Array.<string>} appliances 
     */
    appliances: [],

    /**
     * @property {Object} filters
     */
    filters: {},

    /**
     * @property {Object} filterClasses
     */
    filterClasses: {
        ingredients: 'primary',
        appliances: 'success',
        ustensils: 'danger',
    },
    
    /**
     * @property {Array.<Tag>} stateTags
     */
    stateTags: [],
    
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
    },

    /**
     * @property {(undefined|DomFilter)} currentFilter
     */
    currentFilter: undefined,

    /**
     * Mount controller
     * @async
     * @returns {void}
     */
    async mount () {
        console.log('app mounted');
        await this.fetchData();
        this.applyFilterRecipes();
        this.render();
    },

    /**
     * Render
     * @returns {void}
     */
    render () {
        // Bind
        for (const [, filter] of Object.entries(this.dom.filters)) {
            filter.label.addEventListener('click', (e) => {// Active state
                this.activeIn(filter);
            });
            filter.expand.addEventListener('click', (e) => {// Expand state
                this.toggle(filter);
            });
            filter.input.addEventListener('keyup', (e) => {// Filter input change
                this.filterChange(e);
            });
        }
        this.dom.search.addEventListener('keyup', (e) => {// Search input change
            this.searchChange(e);
        });
        // Render
        this.renderRecipes();
    },

    /**
     * Render Tags
     * @returns {void}
     */
    renderTags () {
        this.dom.tags.innerHTML = '';
        this.stateTags.forEach((tag) => {
            const elTag = tag.renderTag(this.filterClasses[tag.type]);
            elTag.querySelector('button').addEventListener('click', (e) => this.removeTag(tag));// Remove tag on click
            this.dom.tags.append(elTag);
        });
    },

    /**
     * Render Tags
     * @returns {void}
     */
    renderFilter () {
        if (!this.currentFilter) return;
        this.applyFilterFilters();
        const type = this.currentFilter.name;
        this.dom.filters[type].results.innerHTML = '';
        this.filters[type].forEach((item) => {
            const tag = new Tag(item, type)
            if (this.tagIsActive(tag)) return;// Escape active tags
            const elTag = tag.renderLi();
            /*  7) L’utilisateur choisit un mot clé dans le champ */
            elTag.addEventListener('click', (e) => {// Add tag on click
                e.stopPropagation();
                /* 8) Le mot clé apparaît sous forme de tag sous la recherche principale */
                this.addTag(tag);
            });
            this.dom.filters[type].results.append(elTag);
        });
    },

    /**
     * Render Recipes
     * @returns {void}
     */
    renderRecipes () {
        this.dom.recipes.innerHTML = '';
        /*  A1 3) L’interface affiche « Aucune recette ne correspond à votre critère… vous pouvez
            chercher « tarte aux pommes », « poisson », etc.
        */
        this.filterRecipes.forEach((recipe) => {
            this.dom.recipes.append(recipe.render());
        });
    },

    /**
     * Set active state
     * @param {DomFilter} filter
     * @returns {void}
     */
    activeIn (filter) {
        filter.container.classList.add('active');
        if (this.currentFilter) this.activeOut();
        this.currentFilter = filter;
        this.clickOutsideListener = this.clickOutside.bind(this);
        document.addEventListener("click", this.clickOutsideListener);
        this.currentFilter.container.classList.add('active');
        filter.label.style.display = 'none';
        filter.input.style.display = '';
        filter.input.focus();
        this.renderFilter();
        filter.results.style.display = '';
    },

    /**
     * Remove active state
     * @returns {void}
     */
    activeOut () {
        document.removeEventListener("click", this.clickOutsideListener);
        this.currentFilter.container.classList.remove('active');
        this.currentFilter.container.classList.remove('expanded');
        this.currentFilter.label.style.display = '';
        this.currentFilter.input.style.display = 'none';
        this.currentFilter.input.value = "";
        this.currentFilter.results.style.display = 'none';
        this.currentFilter = null;
    },

    /**
     * Toggle expand state
     * @param {DomFilter} filter
     * @returns {void}
     */
    toggle (filter) {
        if (this.currentFilter != filter) this.activeIn(filter);
        filter.container.classList.toggle('expanded');
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
            if (clickTarget == this.currentFilter.container) return;
            clickTarget = clickTarget.parentNode;
        } while (clickTarget);
        this.activeOut();
    },

    /**
     * On filter input change
     * @param {KeyboardEvent} e
     * @returns {void}
     */
    filterChange (e) {
        /*  6) Au fur et à mesure du remplissage les mots clés ne correspondant pas à la frappe dans le
            champ disparaissent. Par exemple, si l’utilisateur entre “coco” dans la liste d’ingrédients,
            seuls vont rester “noix de coco” et “lait de coco”
         */
        console.log(this.currentFilter.input.value);
        this.applyFilterFilters();
        this.renderFilter();
    },
    
    /**
     * On search input change
     * @param {KeyboardEvent} e
     * @returns {void}
     */
    searchChange (e) {
        /*  1) Le cas d’utilisation commence lorsque l’utilisateur entre au moins 3 caractères dans la
            barre de recherche principale.
            3) L’interface est actualisée avec les résultats de recherche
         */
        console.log(this.dom.search.value);
        //if (this.dom.search.value.length >= 3) {}
        this.applyFilterRecipes();
        this.renderRecipes();
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
            /*  9) Les résultats de recherche sont actualisés, ainsi que les éléments disponibles dans les
                champs de recherche avancée
                A2 1) L’utilisateur commence la recherche par un tag
                A2 2) Les résultats de recherche sont actualisés, ainsi que les éléments disponibles dans les
                champs de recherche avancée (9 du cas principal)
                A3 10) L’utilisateur précise sa recherche grâce à l’un des champs : ingrédients, ustensiles, appareil.
                A3 10) Au fur et à mesure du remplissage les mots clés ne correspondant pas à la frappe dans le champ disparaissent
                A3 11) L’utilisateur choisit un mot clé dans le champ
                A3 13) Le mot clé apparaît sous forme de tag sous la recherche principale
                A3 14) Les résultats de recherche sont actualisés, ainsi que les éléments disponibles dans les champs de recherche avancée
            */
            this.renderTags();
            this.renderFilter();
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
     * @returns {void}
     */
    applyFilterRecipes () {
        /*  2) Le système recherche des recettes correspondant à l’entrée utilisateur dans : le titre de
            la recette, la liste des ingrédients de la recette, la description de la recette.
         */
        this.filterRecipes = this.recipes;
    },
    
    /**
     * Apply filters filters
     * @returns {void}
     */
    applyFilterFilters () {
        /*  4) Les champs de recherche avancée sont actualisés avec les informations ingrédients,
            ustensiles, appareil des différentes recettes restantes
            5) L’utilisateur précise sa recherche grâce à l’un des champs : ingrédients, ustensiles, appareil.

        */
        this.filters[this.currentFilter.name] = this[this.currentFilter.name];
    },

    /**
     * Fetch and format data from api
     * @async
     * @returns {Promise}
     */
    async fetchData () {
        recipes.forEach((recipe) => {
            const newRecipe = new Recipe(recipe);
            // recipes
            this.recipes.push(newRecipe);
            // ingredients
            newRecipe.ingredients.forEach((ingredient) => {
                if (!this.ingredients.includes(ingredient.name)) this.ingredients.push(ingredient.name);
            });
            // ustensils
            newRecipe.ustensils.forEach((ustensil) => {
                if (!this.ustensils.includes(ustensil)) this.ustensils.push(ustensil);
            });
            // appliances
            if (!this.appliances.includes(newRecipe.appliance)) this.appliances.push(newRecipe.appliance);
        });
        return new Promise((resolve) => resolve(''));
    },
}
