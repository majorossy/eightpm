/**
 * Test data factory for MagentoCustomer.
 *
 * Usage:
 *   const customer = buildCustomer({ firstname: 'Trey' });
 */
import type { MagentoCustomer } from '@/lib/types';

let customerCounter = 0;

export function resetCustomerCounters() {
  customerCounter = 0;
}

export function buildCustomer(overrides: Partial<MagentoCustomer> = {}): MagentoCustomer {
  customerCounter++;
  return {
    email: `user${customerCounter}@8pm.me`,
    firstname: `User`,
    lastname: `${customerCounter}`,
    ...overrides,
  };
}
