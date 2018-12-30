import * as cozydb from 'cozydb';
import { assert, makeLogger, promisify, promisifyModel } from '../helpers';

let log = makeLogger('models/budget');

let Budget = cozydb.getModel('budget', {
    // Associated category id.
    categoryId: String,

    // Threshold used in the budget section, defined by the user.
    threshold: {
        type: Number,
        default: 0
    },

    // Year
    year: Number,

    // Month
    month: Number
});

Budget = promisifyModel(Budget);

let request = promisify(Budget.request.bind(Budget));

let olderCreate = Budget.create;
Budget.create = async function(userId, attributes) {
    assert(userId === 0, 'Budget.create first arg must be the userId.');
    return await olderCreate(attributes);
};

let olderAll = Budget.all;
Budget.all = async function(userId) {
    assert(userId === 0, 'Budget.all first arg must be the userId.');
    return await olderAll();
};

let olderDestroy = Budget.destroy;
Budget.destroy = async function(userId, budgetId) {
    assert(userId === 0, 'Budget.destroy first arg must be the userId.');
    return await olderDestroy(budgetId);
};

Budget.byCategory = async function byCategory(userId, categoryId) {
    assert(userId === 0, 'Budget.byCategory first arg must be the userId.');

    if (typeof categoryId !== 'string') {
        log.warn(`Budget.byCategory API misuse: ${categoryId}`);
    }

    let params = {
        key: categoryId
    };
    return await request('allByCategory', params);
};

Budget.byYearAndMonth = async function byYearAndMonth(userId, year, month) {
    assert(userId === 0, 'Budget.byYearAndMonth first arg must be the userId.');

    if (typeof year !== 'number') {
        log.warn('Budget.byCategoryAndYearAndMonth misuse: year must be a number');
    }

    if (typeof month !== 'number') {
        log.warn('Budget.byCategoryAndYearAndMonth misuse: year must be a number');
    }

    let params = {
        key: [year, month]
    };
    return await request('allByYearMonth', params);
};

Budget.byCategoryAndYearAndMonth = async function byCategoryAndYearAndMonth(
    userId,
    categoryID,
    year,
    month
) {
    assert(userId === 0, 'Budget.byCategoryAndYearAndMonth first arg must be the userId.');

    if (typeof categoryID !== 'string') {
        log.warn('Budget.byCategoryAndYearAndMonth misuse: categoryId must be a string');
    }

    if (typeof year !== 'number') {
        log.warn('Budget.byCategoryAndYearAndMonth misuse: year must be a number');
    }

    if (typeof month !== 'number') {
        log.warn('Budget.byCategoryAndYearAndMonth misuse: month must be a number');
    }

    let params = {
        key: [categoryID, year, month]
    };
    let budget = await request('byCategoryAndYearAndMonth', params);
    if (budget instanceof Array) {
        if (budget.length > 1) {
            log.warn(
                'Budget.byCategoryAndYearAndMonth: there should be only one budget for a ' +
                    'category/month/year tuple'
            );
        }

        budget = budget[0];
    }

    return budget;
};

let olderUpdateAttributes = Budget.updateAttributes;
Budget.update = async function(userId, budgetId, fields) {
    assert(userId === 0, 'Budget.update first arg must be the userId.');
    return await olderUpdateAttributes(budgetId, fields);
};

Budget.updateAttributes = function() {
    assert(false, 'Budget.updateAttributes is deprecated. Please use Budget.update');
};

Budget.findAndUpdate = async function findAndUpdate(userId, categoryId, year, month, threshold) {
    assert(userId === 0, 'Budget.findAndUpdate first arg must be the userId.');

    const budget = await Budget.byCategoryAndYearAndMonth(userId, categoryId, year, month);
    return await Budget.update(userId, budget.id, { threshold });
};

Budget.destroyForCategory = async function destroyForCategory(userId, categoryId) {
    assert(userId === 0, 'Budget.destroyForCategory first arg must be the userId.');

    let budgets = await Budget.byCategory(userId, categoryId);
    for (let budget of budgets) {
        await Budget.destroy(userId, budget.id);
    }
};

module.exports = Budget;