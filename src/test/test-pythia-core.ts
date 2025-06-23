// Test script for Pythia core functionality
// Run this in the browser console to test all components

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  data?: any;
}

class PythiaTestSuite {
  private results: TestResult[] = [];

  async runAllTests(): Promise<TestResult[]> {
    console.log('🧪 Starting Pythia Core Functionality Tests...');
    
    // Test 1: Buffer System
    await this.testBufferSystem();
    
    // Test 2: Event Tracking
    await this.testEventTracking();
    
    // Test 3: Session Management
    await this.testSessionManagement();
    
    // Test 4: Device Detection
    await this.testDeviceDetection();
    
    // Test 5: UTM Parameter Tracking
    await this.testUTMTracking();
    
    // Test 6: Manual Flush
    await this.testManualFlush();
    
    // Test 7: Ingest Function
    await this.testIngestFunction();
    
    // Test 8: Forecast Function
    await this.testForecastFunction();
    
    // Test 9: Database Connection
    await this.testDatabaseConnection();
    
    // Test 10: Alerts System
    await this.testAlertsSystem();
    
    this.printResults();
    return this.results;
  }

  private addResult(test: string, status: 'pass' | 'fail' | 'warning', message: string, data?: any) {
    this.results.push({ test, status, message, data });
    const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
    console.log(`${emoji} ${test}: ${message}`);
    if (data) console.log('   Data:', data);
  }

  private async testBufferSystem() {
    try {
      // Check if buffer exists
      if (typeof window.pythiaBuffer === 'undefined') {
        this.addResult('Buffer System', 'fail', 'pythiaBuffer not found on window object');
        return;
      }

      // Check buffer is array
      if (!Array.isArray(window.pythiaBuffer)) {
        this.addResult('Buffer System', 'fail', 'pythiaBuffer is not an array');
        return;
      }

      // Check initial state
      const initialSize = window.pythiaBuffer.length;
      this.addResult('Buffer System', 'pass', `Buffer initialized with ${initialSize} events`);
      
    } catch (error) {
      this.addResult('Buffer System', 'fail', `Error: ${error.message}`);
    }
  }

  private async testEventTracking() {
    try {
      // Check if pythia function exists
      if (typeof window.pythia !== 'function') {
        this.addResult('Event Tracking', 'fail', 'pythia function not found');
        return;
      }

      // Test adding an event
      const initialSize = window.pythiaBuffer.length;
      const testEvent = window.pythia('test_event', 1, { test: true });
      const newSize = window.pythiaBuffer.length;

      if (newSize === initialSize + 1) {
        this.addResult('Event Tracking', 'pass', 'Event successfully added to buffer', testEvent);
      } else {
        this.addResult('Event Tracking', 'fail', `Buffer size didn't increase (${initialSize} -> ${newSize})`);
      }
      
    } catch (error) {
      this.addResult('Event Tracking', 'fail', `Error: ${error.message}`);
    }
  }

  private async testSessionManagement() {
    try {
      // Check if session ID exists in localStorage
      const sessionId = localStorage.getItem('pythia_session_id');
      
      if (!sessionId) {
        this.addResult('Session Management', 'fail', 'No session ID found in localStorage');
        return;
      }

      // Validate session ID format (should be UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(sessionId)) {
        this.addResult('Session Management', 'warning', 'Session ID is not a valid UUID format', sessionId);
      } else {
        this.addResult('Session Management', 'pass', 'Valid session ID found', sessionId.substring(0, 8) + '...');
      }
      
    } catch (error) {
      this.addResult('Session Management', 'fail', `Error: ${error.message}`);
    }
  }

  private async testDeviceDetection() {
    try {
      // Add a test event and check device field
      window.pythia('device_test', 1);
      const lastEvent = window.pythiaBuffer[window.pythiaBuffer.length - 1];
      
      if (lastEvent && lastEvent.device) {
        const validDevices = ['Desktop', 'Mobile', 'Tablet'];
        if (validDevices.includes(lastEvent.device)) {
          this.addResult('Device Detection', 'pass', `Device detected: ${lastEvent.device}`);
        } else {
          this.addResult('Device Detection', 'warning', `Unknown device type: ${lastEvent.device}`);
        }
      } else {
        this.addResult('Device Detection', 'fail', 'No device field found in event');
      }
      
    } catch (error) {
      this.addResult('Device Detection', 'fail', `Error: ${error.message}`);
    }
  }

  private async testUTMTracking() {
    try {
      // Check if UTM params are being tracked
      const storedUTM = sessionStorage.getItem('pythia_utm_params');
      
      if (storedUTM) {
        try {
          const utmParams = JSON.parse(storedUTM);
          this.addResult('UTM Tracking', 'pass', 'UTM parameters found in session', utmParams);
        } catch (parseError) {
          this.addResult('UTM Tracking', 'warning', 'UTM params found but invalid JSON');
        }
      } else {
        // Check if current URL has UTM params
        const urlParams = new URLSearchParams(window.location.search);
        const hasUTM = Array.from(urlParams.keys()).some(key => key.startsWith('utm_'));
        
        if (hasUTM) {
          this.addResult('UTM Tracking', 'warning', 'UTM params in URL but not stored');
        } else {
          this.addResult('UTM Tracking', 'pass', 'No UTM parameters (expected for direct traffic)');
        }
      }
      
    } catch (error) {
      this.addResult('UTM Tracking', 'fail', `Error: ${error.message}`);
    }
  }

  private async testManualFlush() {
    try {
      // Check if flushPythia function exists
      if (typeof window.flushPythia !== 'function') {
        this.addResult('Manual Flush', 'fail', 'flushPythia function not found');
        return;
      }

      // Test manual flush (but don't actually flush to avoid data loss)
      const bufferSize = window.pythiaBuffer.length;
      
      if (bufferSize === 0) {
        // Add a test event first
        window.pythia('flush_test', 1);
      }

      this.addResult('Manual Flush', 'pass', `flushPythia function available, buffer has ${bufferSize} events`);
      
    } catch (error) {
      this.addResult('Manual Flush', 'fail', `Error: ${error.message}`);
    }
  }

  private async testIngestFunction() {
    try {
      // Test the ingest endpoint with a small test payload
      const testPayload = [{
        event_type: 'api_test',
        count: 1,
        timestamp: new Date().toISOString(),
        session_id: 'test-session',
        device: 'Test'
      }];

      const response = await fetch('/.netlify/functions/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testPayload)
      });

      if (response.ok) {
        const result = await response.json();
        this.addResult('Ingest Function', 'pass', 'Ingest endpoint responding', {
          status: response.status,
          success: result.success
        });
      } else {
        this.addResult('Ingest Function', 'fail', `Ingest endpoint error: ${response.status} ${response.statusText}`);
      }
      
    } catch (error) {
      this.addResult('Ingest Function', 'fail', `Ingest function error: ${error.message}`);
    }
  }

  private async testForecastFunction() {
    try {
      const response = await fetch('/.netlify/functions/forecast');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.forecast !== undefined) {
          this.addResult('Forecast Function', 'pass', `Forecast generated: ${result.forecast}`, {
            forecast: result.forecast,
            mape: result.mape,
            dataPoints: result.dataPoints
          });
        } else {
          this.addResult('Forecast Function', 'warning', 'Forecast endpoint responded but no forecast value');
        }
      } else {
        this.addResult('Forecast Function', 'fail', `Forecast endpoint error: ${response.status}`);
      }
      
    } catch (error) {
      this.addResult('Forecast Function', 'fail', `Forecast function error: ${error.message}`);
    }
  }

  private async testDatabaseConnection() {
    try {
      const response = await fetch('/.netlify/functions/test-connection');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.success) {
          this.addResult('Database Connection', 'pass', 'Database connection successful', {
            tests: result.tests,
            environment: result.environment
          });
        } else {
          this.addResult('Database Connection', 'fail', 'Database connection failed', result.error);
        }
      } else {
        this.addResult('Database Connection', 'fail', `Database test endpoint error: ${response.status}`);
      }
      
    } catch (error) {
      this.addResult('Database Connection', 'fail', `Database connection error: ${error.message}`);
    }
  }

  private async testAlertsSystem() {
    try {
      const response = await fetch('/.netlify/functions/get-alerts?limit=5');
      
      if (response.ok) {
        const result = await response.json();
        
        if (result.alerts) {
          this.addResult('Alerts System', 'pass', `Alerts system working, ${result.alerts.length} alerts found`, {
            totalAlerts: result.summary?.total || result.alerts.length,
            unacknowledged: result.summary?.unacknowledged || 0
          });
        } else {
          this.addResult('Alerts System', 'warning', 'Alerts endpoint responded but no alerts array');
        }
      } else {
        this.addResult('Alerts System', 'fail', `Alerts endpoint error: ${response.status}`);
      }
      
    } catch (error) {
      this.addResult('Alerts System', 'fail', `Alerts system error: ${error.message}`);
    }
  }

  private printResults() {
    console.log('\n📊 Pythia Test Results Summary:');
    console.log('================================');
    
    const passed = this.results.filter(r => r.status === 'pass').length;
    const failed = this.results.filter(r => r.status === 'fail').length;
    const warnings = this.results.filter(r => r.status === 'warning').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️ Warnings: ${warnings}`);
    console.log(`📈 Success Rate: ${Math.round((passed / this.results.length) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results.filter(r => r.status === 'fail').forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
    
    if (warnings > 0) {
      console.log('\n⚠️ Warnings:');
      this.results.filter(r => r.status === 'warning').forEach(result => {
        console.log(`   • ${result.test}: ${result.message}`);
      });
    }
  }
}

// Export for use in browser console
(window as any).PythiaTestSuite = PythiaTestSuite;

// Auto-run if in browser
if (typeof window !== 'undefined') {
  console.log('🧪 Pythia Test Suite loaded. Run: new PythiaTestSuite().runAllTests()');
}

export default PythiaTestSuite;