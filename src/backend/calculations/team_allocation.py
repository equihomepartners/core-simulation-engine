"""
Team Allocation module for the Equihome Fund Simulation Engine.

This module provides classes and functions for modeling the distribution of economics
among the GP team, including partners and employees.
"""

from decimal import Decimal
from typing import Dict, Any, List, Optional, Union
import copy


def _to_decimal(value: Union[int, float, str, Decimal]) -> Decimal:
    """
    Convert a value to Decimal.
    
    Args:
        value: Value to convert
        
    Returns:
        Decimal value
    """
    if isinstance(value, Decimal):
        return value
    
    try:
        return Decimal(str(value))
    except:
        return Decimal('0')


class TeamAllocation:
    """
    Represents the team allocation of economics within the GP entity.
    """
    def __init__(self, config: Dict[str, Any]):
        """
        Initialize a team allocation with the given configuration.
        
        Args:
            config: Team allocation configuration
        """
        self.partners = config.get('partners', [])
        self.employees = config.get('employees', [])
        
    def calculate_allocation(self, basic_economics: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculate team allocation of economics.
        
        Args:
            basic_economics: Basic GP economics
            
        Returns:
            Dictionary with team allocation
        """
        # Calculate total carry percentage
        total_partner_carry = sum(_to_decimal(partner.get('carry_percentage', 0)) for partner in self.partners)
        total_employee_carry = sum(_to_decimal(employee.get('carry_percentage', 0)) for employee in self.employees)
        
        # Calculate total management fee percentage
        total_partner_mgmt = sum(_to_decimal(partner.get('management_fee_percentage', 0)) for partner in self.partners)
        total_employee_mgmt = sum(_to_decimal(employee.get('management_fee_percentage', 0)) for employee in self.employees)
        
        # Calculate total origination fee percentage
        total_partner_orig = sum(_to_decimal(partner.get('origination_fee_percentage', 0)) for partner in self.partners)
        total_employee_orig = sum(_to_decimal(employee.get('origination_fee_percentage', 0)) for employee in self.employees)
        
        # Calculate carried interest allocation
        carried_interest = basic_economics['total_carried_interest']
        partner_carried_interest = self._calculate_partner_carried_interest(carried_interest, total_partner_carry)
        employee_carried_interest = self._calculate_employee_carried_interest(carried_interest, total_employee_carry)
        
        # Calculate management fee allocation
        management_fees = basic_economics['total_management_fees']
        partner_management_fees = self._calculate_partner_management_fees(management_fees, total_partner_mgmt)
        employee_management_fees = self._calculate_employee_management_fees(management_fees, total_employee_mgmt)
        
        # Calculate origination fee allocation
        origination_fees = basic_economics['total_origination_fees']
        partner_origination_fees = self._calculate_partner_origination_fees(origination_fees, total_partner_orig)
        employee_origination_fees = self._calculate_employee_origination_fees(origination_fees, total_employee_orig)
        
        # Calculate yearly allocations
        yearly_allocations = self._calculate_yearly_allocations(basic_economics)
        
        # Calculate total compensation
        partner_total_compensation = {}
        for partner in self.partners:
            name = partner.get('name', 'Partner')
            salary = _to_decimal(partner.get('salary', 0))
            carry = partner_carried_interest.get(name, Decimal('0'))
            mgmt_fees = partner_management_fees.get(name, Decimal('0'))
            orig_fees = partner_origination_fees.get(name, Decimal('0'))
            
            partner_total_compensation[name] = salary + carry + mgmt_fees + orig_fees
        
        employee_total_compensation = {}
        for employee in self.employees:
            role = employee.get('role', 'Employee')
            count = int(employee.get('count', 1))
            salary = _to_decimal(employee.get('salary', 0)) * count
            carry = employee_carried_interest.get(role, Decimal('0'))
            mgmt_fees = employee_management_fees.get(role, Decimal('0'))
            orig_fees = employee_origination_fees.get(role, Decimal('0'))
            
            employee_total_compensation[role] = salary + carry + mgmt_fees + orig_fees
        
        return {
            'partner_carried_interest': partner_carried_interest,
            'employee_carried_interest': employee_carried_interest,
            'partner_management_fees': partner_management_fees,
            'employee_management_fees': employee_management_fees,
            'partner_origination_fees': partner_origination_fees,
            'employee_origination_fees': employee_origination_fees,
            'partner_total_compensation': partner_total_compensation,
            'employee_total_compensation': employee_total_compensation,
            'total_partner_allocation': sum(partner_total_compensation.values()),
            'total_employee_allocation': sum(employee_total_compensation.values()),
            'yearly_allocations': yearly_allocations
        }
    
    def _calculate_partner_carried_interest(self, carried_interest: Decimal, total_partner_carry: Decimal) -> Dict[str, Decimal]:
        """
        Calculate carried interest allocation among partners.
        
        Args:
            carried_interest: Total carried interest
            total_partner_carry: Total partner carry percentage
            
        Returns:
            Dictionary with partner carried interest allocation
        """
        partner_carried_interest = {}
        
        for partner in self.partners:
            name = partner.get('name', 'Partner')
            carry_percentage = _to_decimal(partner.get('carry_percentage', 0))
            
            if total_partner_carry > Decimal('0'):
                partner_carried_interest[name] = carried_interest * carry_percentage / total_partner_carry
            else:
                partner_carried_interest[name] = Decimal('0')
        
        return partner_carried_interest
    
    def _calculate_employee_carried_interest(self, carried_interest: Decimal, total_employee_carry: Decimal) -> Dict[str, Decimal]:
        """
        Calculate carried interest allocation among employees.
        
        Args:
            carried_interest: Total carried interest
            total_employee_carry: Total employee carry percentage
            
        Returns:
            Dictionary with employee carried interest allocation
        """
        employee_carried_interest = {}
        
        for employee in self.employees:
            role = employee.get('role', 'Employee')
            carry_percentage = _to_decimal(employee.get('carry_percentage', 0))
            
            if total_employee_carry > Decimal('0'):
                employee_carried_interest[role] = carried_interest * carry_percentage / total_employee_carry
            else:
                employee_carried_interest[role] = Decimal('0')
        
        return employee_carried_interest
    
    def _calculate_partner_management_fees(self, management_fees: Decimal, total_partner_mgmt: Decimal) -> Dict[str, Decimal]:
        """
        Calculate management fee allocation among partners.
        
        Args:
            management_fees: Total management fees
            total_partner_mgmt: Total partner management fee percentage
            
        Returns:
            Dictionary with partner management fee allocation
        """
        partner_management_fees = {}
        
        for partner in self.partners:
            name = partner.get('name', 'Partner')
            mgmt_percentage = _to_decimal(partner.get('management_fee_percentage', 0))
            
            if total_partner_mgmt > Decimal('0'):
                partner_management_fees[name] = management_fees * mgmt_percentage / total_partner_mgmt
            else:
                partner_management_fees[name] = Decimal('0')
        
        return partner_management_fees
    
    def _calculate_employee_management_fees(self, management_fees: Decimal, total_employee_mgmt: Decimal) -> Dict[str, Decimal]:
        """
        Calculate management fee allocation among employees.
        
        Args:
            management_fees: Total management fees
            total_employee_mgmt: Total employee management fee percentage
            
        Returns:
            Dictionary with employee management fee allocation
        """
        employee_management_fees = {}
        
        for employee in self.employees:
            role = employee.get('role', 'Employee')
            mgmt_percentage = _to_decimal(employee.get('management_fee_percentage', 0))
            
            if total_employee_mgmt > Decimal('0'):
                employee_management_fees[role] = management_fees * mgmt_percentage / total_employee_mgmt
            else:
                employee_management_fees[role] = Decimal('0')
        
        return employee_management_fees
    
    def _calculate_partner_origination_fees(self, origination_fees: Decimal, total_partner_orig: Decimal) -> Dict[str, Decimal]:
        """
        Calculate origination fee allocation among partners.
        
        Args:
            origination_fees: Total origination fees
            total_partner_orig: Total partner origination fee percentage
            
        Returns:
            Dictionary with partner origination fee allocation
        """
        partner_origination_fees = {}
        
        for partner in self.partners:
            name = partner.get('name', 'Partner')
            orig_percentage = _to_decimal(partner.get('origination_fee_percentage', 0))
            
            if total_partner_orig > Decimal('0'):
                partner_origination_fees[name] = origination_fees * orig_percentage / total_partner_orig
            else:
                partner_origination_fees[name] = Decimal('0')
        
        return partner_origination_fees
    
    def _calculate_employee_origination_fees(self, origination_fees: Decimal, total_employee_orig: Decimal) -> Dict[str, Decimal]:
        """
        Calculate origination fee allocation among employees.
        
        Args:
            origination_fees: Total origination fees
            total_employee_orig: Total employee origination fee percentage
            
        Returns:
            Dictionary with employee origination fee allocation
        """
        employee_origination_fees = {}
        
        for employee in self.employees:
            role = employee.get('role', 'Employee')
            orig_percentage = _to_decimal(employee.get('origination_fee_percentage', 0))
            
            if total_employee_orig > Decimal('0'):
                employee_origination_fees[role] = origination_fees * orig_percentage / total_employee_orig
            else:
                employee_origination_fees[role] = Decimal('0')
        
        return employee_origination_fees
    
    def _calculate_yearly_allocations(self, basic_economics: Dict[str, Any]) -> Dict[str, Dict[str, Dict[str, float]]]:
        """
        Calculate yearly allocations of economics.
        
        Args:
            basic_economics: Basic GP economics
            
        Returns:
            Dictionary with yearly allocations
        """
        yearly_allocations = {}
        
        # Get all years
        all_years = set()
        all_years.update(basic_economics['yearly_management_fees'].keys())
        all_years.update(basic_economics['yearly_carried_interest'].keys())
        all_years.update(basic_economics['yearly_origination_fees'].keys())
        
        # Calculate total percentages
        total_partner_carry = sum(_to_decimal(partner.get('carry_percentage', 0)) for partner in self.partners)
        total_employee_carry = sum(_to_decimal(employee.get('carry_percentage', 0)) for employee in self.employees)
        
        total_partner_mgmt = sum(_to_decimal(partner.get('management_fee_percentage', 0)) for partner in self.partners)
        total_employee_mgmt = sum(_to_decimal(employee.get('management_fee_percentage', 0)) for employee in self.employees)
        
        total_partner_orig = sum(_to_decimal(partner.get('origination_fee_percentage', 0)) for partner in self.partners)
        total_employee_orig = sum(_to_decimal(employee.get('origination_fee_percentage', 0)) for employee in self.employees)
        
        # Calculate yearly allocations
        for year in all_years:
            yearly_carried_interest = basic_economics['yearly_carried_interest'].get(year, Decimal('0'))
            yearly_management_fees = basic_economics['yearly_management_fees'].get(year, Decimal('0'))
            yearly_origination_fees = basic_economics['yearly_origination_fees'].get(year, Decimal('0'))
            
            # Partner allocations
            partner_allocations = {}
            for partner in self.partners:
                name = partner.get('name', 'Partner')
                carry_percentage = _to_decimal(partner.get('carry_percentage', 0))
                mgmt_percentage = _to_decimal(partner.get('management_fee_percentage', 0))
                orig_percentage = _to_decimal(partner.get('origination_fee_percentage', 0))
                
                # Calculate allocations
                carry_allocation = yearly_carried_interest * carry_percentage / total_partner_carry if total_partner_carry > Decimal('0') else Decimal('0')
                mgmt_allocation = yearly_management_fees * mgmt_percentage / total_partner_mgmt if total_partner_mgmt > Decimal('0') else Decimal('0')
                orig_allocation = yearly_origination_fees * orig_percentage / total_partner_orig if total_partner_orig > Decimal('0') else Decimal('0')
                
                partner_allocations[name] = {
                    'carried_interest': float(carry_allocation),
                    'management_fees': float(mgmt_allocation),
                    'origination_fees': float(orig_allocation),
                    'total': float(carry_allocation + mgmt_allocation + orig_allocation)
                }
            
            # Employee allocations
            employee_allocations = {}
            for employee in self.employees:
                role = employee.get('role', 'Employee')
                carry_percentage = _to_decimal(employee.get('carry_percentage', 0))
                mgmt_percentage = _to_decimal(employee.get('management_fee_percentage', 0))
                orig_percentage = _to_decimal(employee.get('origination_fee_percentage', 0))
                
                # Calculate allocations
                carry_allocation = yearly_carried_interest * carry_percentage / total_employee_carry if total_employee_carry > Decimal('0') else Decimal('0')
                mgmt_allocation = yearly_management_fees * mgmt_percentage / total_employee_mgmt if total_employee_mgmt > Decimal('0') else Decimal('0')
                orig_allocation = yearly_origination_fees * orig_percentage / total_employee_orig if total_employee_orig > Decimal('0') else Decimal('0')
                
                employee_allocations[role] = {
                    'carried_interest': float(carry_allocation),
                    'management_fees': float(mgmt_allocation),
                    'origination_fees': float(orig_allocation),
                    'total': float(carry_allocation + mgmt_allocation + orig_allocation)
                }
            
            yearly_allocations[year] = {
                'partners': partner_allocations,
                'employees': employee_allocations
            }
        
        return yearly_allocations
