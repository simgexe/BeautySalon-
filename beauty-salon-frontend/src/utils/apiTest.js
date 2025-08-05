// API Test Utility
import { customerService, appointmentService, serviceService } from '../api/api';

export const testApiConnection = async () => {
  const results = {
    customers: false,
    appointments: false,
    services: false,
    errors: []
  };

  try {
    // Test customers endpoint
    const customersResponse = await customerService.getAll();
    results.customers = true;
    console.log('✅ Customers API working:', customersResponse.data?.length || 0, 'customers found');
  } catch (error) {
    results.customers = false;
    results.errors.push(`Customers API Error: ${error.message}`);
    console.error('❌ Customers API Error:', error);
  }

  try {
    // Test appointments endpoint
    const appointmentsResponse = await appointmentService.getAll();
    results.appointments = true;
    console.log('✅ Appointments API working:', appointmentsResponse.data?.length || 0, 'appointments found');
  } catch (error) {
    results.appointments = false;
    results.errors.push(`Appointments API Error: ${error.message}`);
    console.error('❌ Appointments API Error:', error);
  }

  try {
    // Test services endpoint
    const servicesResponse = await serviceService.getAll();
    results.services = true;
    console.log('✅ Services API working:', servicesResponse.data?.length || 0, 'services found');
  } catch (error) {
    results.services = false;
    results.errors.push(`Services API Error: ${error.message}`);
    console.error('❌ Services API Error:', error);
  }

  return results;
};

export const checkApiHealth = async () => {
  try {
    const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:7072/api';
    const response = await fetch(`${apiUrl}/health`);
    if (response.ok) {
      console.log('✅ API Health Check: OK');
      return true;
    } else {
      console.error('❌ API Health Check: Failed', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ API Health Check Error:', error);
    return false;
  }
}; 