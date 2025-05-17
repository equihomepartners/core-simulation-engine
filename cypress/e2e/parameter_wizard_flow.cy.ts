describe('Parameter Wizard End-to-End Flow', () => {
  it('fills out the wizard and submits correct parameters to the backend', () => {
    // Visit the wizard page
    cy.visit('/wizard');

    // --- Basic Fund Config Step ---
    cy.get('input[name="fund_size"]').clear().type('50000000');
    cy.get('input[name="fund_term"]').clear().type('7');
    cy.get('select[name="waterfall_structure"]').select('european');
    cy.get('select[name="management_fee_basis"]').select('committed_capital');
    cy.get('input[name="hurdle_rate"]').invoke('val', 0.08).trigger('change');
    cy.get('input[name="carried_interest_rate"]').invoke('val', 0.2).trigger('change');
    cy.get('input[name="management_fee_rate"]').invoke('val', 0.02).trigger('change');
    cy.get('input[name="gp_commitment_percentage"]').invoke('val', 0.05).trigger('change');
    cy.get('input[name="zone_targets.green"]').invoke('val', 0.5).trigger('change');
    cy.get('input[name="zone_targets.orange"]').invoke('val', 0.3).trigger('change');
    cy.get('input[name="zone_targets.red"]').invoke('val', 0.2).trigger('change');
    cy.get('input[name="deployment_monthly_granularity"]').check();

    cy.contains('Next').click();

    // --- Advanced Parameters Step (example fields) ---
    cy.get('input[name="default_correlation.enabled"]').check();
    cy.get('input[name="default_correlation.same_zone"]').invoke('val', 0.3).trigger('change');
    cy.get('input[name="default_correlation.cross_zone"]').invoke('val', 0.1).trigger('change');
    cy.get('input[name="zone_rebalancing_enabled"]').check();
    cy.get('input[name="rebalancing_strength"]').invoke('val', 0.5).trigger('change');
    cy.get('input[name="zone_drift_threshold"]').invoke('val', 0.1).trigger('change');
    cy.get('input[name="zone_allocation_precision"]').invoke('val', 0.8).trigger('change');
    cy.get('input[name="avg_loan_exit_year"]').clear().type('5');
    cy.get('input[name="exit_year_std_dev"]').clear().type('1.5');
    cy.get('input[name="min_holding_period"]').clear().type('0.25');
    cy.get('input[name="exit_year_skew"]').invoke('val', 0).trigger('change');
    cy.get('input[name="simulate_full_lifecycle"]').check();
    cy.get('input[name="enable_reinvestments"]').check();
    cy.get('input[name="enable_defaults"]').check();
    cy.get('input[name="enable_early_repayments"]').check();
    cy.get('input[name="enable_appreciation"]').check();
    cy.get('input[name="early_exit_probability"]').invoke('val', 0.1).trigger('change');
    cy.get('input[name="reinvestment_rate"]').invoke('val', 0.8).trigger('change');
    cy.get('input[name="default_rates.green"]').invoke('val', 0.01).trigger('change');
    cy.get('input[name="default_rates.orange"]').invoke('val', 0.02).trigger('change');
    cy.get('input[name="default_rates.red"]').invoke('val', 0.03).trigger('change');
    cy.get('input[name="appreciation_rates.green"]').invoke('val', 0.08).trigger('change');
    cy.get('input[name="appreciation_rates.orange"]').invoke('val', 0.06).trigger('change');
    cy.get('input[name="appreciation_rates.red"]').invoke('val', 0.04).trigger('change');
    cy.get('select[name="appreciation_share_method"]').select('fixed_rate');
    cy.get('input[name="property_value_discount_rate"]').invoke('val', 0.05).trigger('change');
    cy.get('select[name="appreciation_base"]').select('discounted_value');
    cy.get('select[name="distribution_frequency"]').select('annual');
    cy.get('input[name="management_fee_offset_percentage"]').invoke('val', 0.0).trigger('change');
    cy.get('input[name="origination_fee_rate"]').invoke('val', 0.01).trigger('change');
    cy.get('input[name="origination_fee_to_gp"]').check();
    cy.get('input[name="expense_rate"]').invoke('val', 0.005).trigger('change');
    cy.get('input[name="formation_costs"]').clear().type('100000');
    cy.contains('Next').click();

    // --- Market Conditions Step (example) ---
    // (Add selectors for market conditions fields as needed)
    cy.contains('Next').click();

    // --- GP Economics Step (example) ---
    cy.get('input[name="gp_entity.name"]').clear().type('Sample GP');
    cy.get('input[name="gp_entity.management_company.base_expenses"]').clear().type('250000');
    cy.get('input[name="gp_entity.management_company.expense_growth_rate"]').invoke('val', 0.03).trigger('change');
    cy.get('input[name="gp_entity.management_company.office_expenses"]').clear().type('100000');
    cy.get('input[name="gp_entity.management_company.technology_expenses"]').clear().type('50000');
    cy.get('input[name="gp_entity.management_company.marketing_expenses"]').clear().type('50000');
    cy.get('input[name="gp_entity.management_company.legal_expenses"]').clear().type('100000');
    cy.get('input[name="gp_entity.management_company.other_expenses"]').clear().type('200000');
    cy.contains('Next').click();

    // --- Analysis Settings Step (example) ---
    cy.get('input[name="monte_carlo_enabled"]').uncheck();
    cy.get('input[name="num_simulations"]').clear().type('1000');
    cy.get('input[name="num_processes"]').clear().type('4');
    cy.get('input[name="random_seed"]').clear().type('42');
    cy.get('select[name="distribution_type"]').select('normal');
    cy.get('input[name="convergence_analysis"]').uncheck();
    cy.get('input[name="convergence_tolerance"]').invoke('val', 0.01).trigger('change');
    cy.get('input[name="cache_simulations"]').check();
    cy.contains('Next').click();

    // --- Review & Submit Step ---
    cy.intercept('POST', '/api/simulations').as('createSimulation');
    cy.contains('Submit').click();

    // Wait for the API call and check the payload
    cy.wait('@createSimulation').then((interception) => {
      const body = interception.request.body;
      expect(body).to.have.property('fund_size', 50000000);
      expect(body).to.have.property('fund_term', 7);
      expect(body).to.have.property('waterfall_structure', 'european');
      expect(body).to.have.property('hurdle_rate', 0.08);
      expect(body).to.have.property('carried_interest_rate', 0.2);
      expect(body).to.have.property('management_fee_rate', 0.02);
      expect(body).to.have.property('gp_commitment_percentage', 0.05);
      // ...add more assertions for all parameters as needed...
    });

    // Optionally, check for a success message or navigation
    cy.contains('Simulation created').should('exist');
  });
}); 