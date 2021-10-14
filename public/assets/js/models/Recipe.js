






import Ingredient from "./Ingredient.js";
import Tag from "./Tag.js";

/**
 * @class Recipe
 * @property {number} id
 * @property {string} name
 * @property {number} servings
 * @property {number} time
 * @property {string} description
 * @property {string} appliance
 * @property {Array.<string>} ustensils
 * @property {Array.<Ingredient>} ingredients
 */
export default class Recipe {
    /**
     * @constructor
     * @param {Object} data 
     * @param {number} data.id
     * @param {string} data.name
     * @param {number} data.servings
     * @param {number} data.time
     * @param {string} data.description
     * @param {string} data.appliance
     * @param {Array.<string>} data.ustensils
     * @param {Array.<Object>} data.ingredients
     */
    constructor(data) {
        this.id = data.id;
        this.name = data.name;
        this.servings = data.servings;
        this.time = data.time;
        this.description = data.description;
        this.appliance = data.appliance.toLowerCase();

        this.ustensils = [];
        data.ustensils.forEach((ustensil) => this.ustensils.push(ustensil.toLowerCase()));

        this.ingredients = [];
        data.ingredients.forEach( (ingredient) => this.ingredients.push(new Ingredient(ingredient)));
    }

    /**
     * Short description
     * @returns {string}
     */
    get shortDescription () {
        const limit = 200;
        if (this.description.length <= limit) return this.description;
        let description = this.description.substr(0, limit - 1);
        return description.substr(0, description.lastIndexOf(" ")) + " &hellip;";
    }

    /**
     * Short description
     * @param {Tag} tag
     * @returns {boolean}
     */
    tagAvailable (tag) {
        if (tag.type == 'ingredients') return !! this.ingredients.find((ingredient) => ingredient.name == tag.name);
        if (tag.type == 'ustensils') return this.ustensils.includes(tag.name);
        if (tag.type == 'appliances') return this.appliance == tag.name;
    }

    /**
     * Render recipe
     * @returns {HTMLElement}
     */
    render () {
        const elRecipe = document.createElement('article');
        elRecipe.classList.add('card');
        elRecipe.innerHTML = `
            <div class="card-picture"></div>
            <div class="card-header">
                <div class="card-header-title">${this.name}</div>
                <div class="card-header-time">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M10 0C4.5 0 0 4.5 0 10C0 15.5 4.5 20 10 20C15.5 20 20 15.5 20 10C20 4.5 15.5 0 10 0ZM10 18C5.59 18 2 14.41 2 10C2 5.59 5.59 2 10 2C14.41 2 18 5.59 18 10C18 14.41 14.41 18 10 18ZM10.5 5H9V11L14.2 14.2L15 12.9L10.5 10.2V5Z" fill="black"/></svg>
                    ${this.time} min
                </div>
            </div>
            <div class="card-body">
                <div class="card-body-ingredients"></div>
                <div class="card-body-recipe">${this.shortDescription}</div>
            </div>
        `;
        let ingredients = elRecipe.querySelector('.card-body-ingredients');
        this.ingredients.forEach((ingredient) => {
            if (ingredient.quantity) ingredients.innerHTML += `<div class="ingredient"><b>${ingredient.name.charAt(0).toUpperCase() + ingredient.name.slice(1)}:</b> ${ingredient.quantity} ${(ingredient.unit) ? ingredient.unit : ''}</div>`;
            else ingredients.innerHTML += `<div class="ingredient"><b>${ingredient.name}</div>`;
        });
        return elRecipe;
    }
}