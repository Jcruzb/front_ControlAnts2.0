import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUnrepresentedIncomes } from '../src/utils/incomePlans.js';

test('shows inactive linked incomes and hides only receipts already represented by a card', () => {
  const incomes = [{ id: 1, income_plan: 4 }, { id: 2, income_plan: 5 }, { id: 3, income_plan: null }];
  assert.deepEqual(getUnrepresentedIncomes(incomes, [{ resolved_income: { id: 1 } }]), [incomes[1], incomes[2]]);
  assert.deepEqual(getUnrepresentedIncomes(incomes, []), incomes);
});
