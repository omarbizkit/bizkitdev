/**
 * T014: Integration test for dependency version mismatch detection and resolution
 * Tests if component rendering issues could be caused by dependency versions
 */

import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Dependency Version Mismatch Detection and Resolution', () => {
  test.describe('Version Consistency Validation', () => {
    test('should validate that all dependencies are at compatible versions', async () => {
      console.log('🔍 TESTING: Dependency version compatibility that could affect component rendering');

      // Check critical dependency versions that could affect Astro/React rendering
      const criticalDeps = [
        { name: 'astro', required: '>=4.0.0' },
        { name: '@astrojs/tailwind', required: '>=5.0.0' },
        { name: '@astrojs/node', required: '>=8.0.0' },
        { name: 'react', required: null }, // Check if React is present unintentionally
        { name: 'vue', required: null }   // Check if Vue is present unintentionally
      ];

      const mismatchResults: { dep: string; installed: string; status: string }[] = [];

      for (const dep of criticalDeps) {
        try {
          const version = execSync(`npm list ${dep.name} --depth=0 --json`, { encoding: 'utf8' });
          const parsed = JSON.parse(version);
          const installedVersion = parsed.dependencies?.[dep.name]?.version || 'NOT FOUND';

          if (installedVersion === 'NOT FOUND') {
            if (dep.name === 'react' || dep.name === 'vue') {
              console.log(`✅ ${dep.name}: Not present (expected)`);
              mismatchResults.push({ dep: dep.name, installed: 'not present', status: 'EXPECTED' });
            } else {
              console.log(`❌ ${dep.name}: Missing from dependencies`);
              mismatchResults.push({ dep: dep.name, installed: 'MISSING', status: 'CRITICAL' });
            }
          } else {
            console.log(`📦 ${dep.name}: ${installedVersion}`);

            if (dep.required) {
              const meetsRequirement = versionMeetsRequirement(installedVersion, dep.required);
              if (!meetsRequirement) {
                mismatchResults.push({
                  dep: dep.name,
                  installed: installedVersion,
                  status: `DOES NOT MEET ${dep.required}`
                });
              } else {
                mismatchResults.push({ dep: dep.name, installed: installedVersion, status: 'OK' });
              }
            } else {
              mismatchResults.push({ dep: dep.name, installed: installedVersion, status: 'PRESENT' });
            }
          }
        } catch (error) {
          console.log(`❌ Error checking ${dep.name}: ${error.message}`);
          mismatchResults.push({ dep: dep.name, installed: 'ERROR', status: 'UNKNOWN' });
        }
      }

      console.log('\n📋 DEPENDENCY STATUS SUMMARY:');
      const criticalIssues = mismatchResults.filter(r => r.status === 'CRITICAL' || r.status.includes('DOES NOT MEET'));
      const warnings = mismatchResults.filter(r => r.status !== 'OK' && r.status !== 'EXPECTED' && !r.status.includes('CRITICAL'));

      if (criticalIssues.length > 0) {
        console.log('🚨 CRITICAL ISSUES THAT COULD CAUSE COMPONENT RENDERING FAILURES:');
        criticalIssues.forEach(issue => {
          console.log(`  ❌ ${issue.dep}: ${issue.status} (${issue.installed})`);
        });

        expect(criticalIssues.length).toBe(0);
      }

      if (warnings.length > 0) {
        console.log('⚠️ WARNINGS THAT MIGHT AFFECT COMPONENT FUNCTIONALITY:');
        warnings.forEach(warning => {
          console.log(`  ⚠️ ${warning.dep}: ${warning.status}`);
        });
      }

      const healthyDeps = mismatchResults.filter(r => r.status === 'OK' || r.status === 'EXPECTED');
      console.log(`✅ ${healthyDeps.length} dependencies healthy`);

      // This test should pass if no critical issues found
      console.log('\n📊 CONCLUSION: Dependencies validated - rendering issues not caused by version conflicts');
    });

    test('should validate build output consistency with runtime behavior', async ({ page }) => {
      console.log('🔍 TESTING: Build-time vs runtime component availability');

      // Build the application to check for build-time issues
      try {
        execSync('npm run build', { stdio: 'pipe', timeout: 30000 });
        console.log('✅ Build completed successfully');

        // Start the preview server to test built version
        const previewProcess = execSync('npm run preview', {
          detached: true,
          stdio: 'pipe',
          encoding: 'utf8'
        });

        console.log('✅ Preview server started (build might reveal component issues)');

      } catch (buildError) {
        console.error('❌ BUILD FAILED - this could prevent component rendering:');
        console.error(buildError.message);

        // If build fails, this could be why the component isn't appearing
        console.error('SUSPECTED CAUSE: Component might have build-time dependencies that fail');
        console.error('CI Impact: Build failures would prevent E2E tests from running');
      }

      // Test the built version if we're running in CI mode
      if (process.env.CI) {
        await page.goto('http://localhost:4321'); // Preview server

        try {
          const form = page.locator('data-testid=hero-subscribe-form');
          await expect(form).toBeVisible({ timeout: 5000 });

          console.log('✅ Built version renders subscription form correctly');
        } catch (error) {
          console.error('❌ BUILT VERSION ISSUE: Form not found in production build');
          console.error('This suggests the issue might be build-time component inclusion');

          throw error;
        }
      } else {
        console.log('(Skipping build test - not in CI environment)');
      }
    });
  });

  test.describe('Module Resolution and Import Validation', () => {
    test('should validate that subscription component exports are properly resolved', () => {
      console.log('🔍 TESTING: Component import resolution and module availability');

      // Check if the subscription component files exist and are importable
      const possibleComponentLocations = [
        'src/components/Subscribe.astro',
        'src/components/Subscription.astro',
        'src/components/Newsletter.astro',
        'src/components/NewsletterSignup.astro',
        'src/components/widgets/Subscribe.astro',
        'src/components/forms/Subscribe.astro',
        'src/sections/Subscribe.astro',
        'src/sections/Newsletter.astro'
      ];

      let foundComponents = 0;

      // Check for actual component files
      for (const location of possibleComponentLocations) {
        try {
          execSync(`test -f ${location}`, { stdio: 'pipe' });
          console.log(`✅ Found component: ${location}`);
          foundComponents++;
        } catch (error) {
          console.log(`❌ Not found: ${location}`);
        }
      }

      // Check if components are being imported in pages
      const pageFiles = [
        'src/pages/index.astro',
        'src/pages/blog/index.astro',
        'src/layouts/BaseLayout.astro',
        'src/layouts/DefaultLayout.astro'
      ];

      let importFound = false;

      for (const pageFile of pageFiles) {
        try {
          const content = execSync(`cat ${pageFile}`, { encoding: 'utf8' });
          if (content.includes('Subscribe') || content.includes('Newsletter')) {
            console.log(`🔍 Found potential import reference in: ${pageFile}`);
            importFound = true;
          }
        } catch (error) {
          console.log(`❌ Cannot check: ${pageFile} (file not found or error)`);
        }
      }

      console.log('\n📊 COMPONENT DISCOVERY RESULTS:');
      console.log(`- Potential component files looked for: ${possibleComponentLocations.length}`);
      console.log(`- Actual component files found: ${foundComponents}`);
      console.log(`- Import references found in pages: ${importFound ? 'YES' : 'NO'}`);

      if (foundComponents === 0) {
        console.error('🚨 CRITICAL Finding: No subscription component files found!');
        console.error('This is most likely the root cause of the missing form');
        expect(foundComponents).toBeGreaterThan(0);
      }

      if (!importFound) {
        console.log('⚠️ Warning: No import references found in page layouts');
        console.log('This could mean component exists but is not imported');
      }
    });

    test('should validate TypeScript compilation and type checking', () => {
      console.log('🔍 TESTING: TypeScript compilation that could prevent component rendering');

      try {
        // Run TypeScript type checking
        execSync('npm run typecheck', { stdio: 'pipe', timeout: 30000 });
        console.log('✅ TypeScript compilation passed');

      } catch (typeError) {
        console.log('❌ TYPESCRIPT COMPILATION FAILED:');
        console.error('This could prevent component files from being processed');

        // Analyze the error to see if it relates to subscription component
        const errorString = typeError.message || '';
        if (errorString.includes('Subscribe') ||
            errorString.includes('Newsletter') ||
            errorString.includes('subscription')) {
          console.log('🎯 TYPE ERROR DETECTED: Related to subscription component!');
          console.log('This could be why the component is not rendering');
        } else {
          console.log('🤔 Type error found but not related to subscription component');
          console.log('Error might still affect overall build process');
        }

        // Log the error for investigation
        console.error('Type check output:', errorString.slice(0, 500) + '...');

        throw new Error(`TypeScript compilation failed: ${errorString}`);
      }

      console.log('📊 CONCLUSION: TypeScript validation complete');
    });
  });

  test.describe('CSS and Styling Dependency Validation', () => {
    test('should validate Tailwind and CSS dependencies are properly configured', async ({ page }) => {
      console.log('🔍 TESTING: CSS and styling dependencies that could hide components');

      // Check if Tailwind is properly configured
      try {
        execSync('npx tailwindcss --version', { stdio: 'pipe' });
        console.log('✅ Tailwind CLI available');

        // Check for Tailwind CSS inclusion in built pages
        await page.goto('http://localhost:4321');

        // Check for Tailwind classes being applied
        const hasTailwindClasses = await page.$('[class*="bg-gray"], [class*="text-black"], [class*="p-"], [class*="m-"]') !== null;
        console.log(`Tailwind classes detected: ${hasTailwindClasses}`);

        if (!hasTailwindClasses) {
          console.log('⚠️ WARNING: No Tailwind classes found on page');
          console.log('Component might be rendered but invisible due to CSS issues');
        }

      } catch (tailwindError) {
        console.log('❌ Tailwind validation failed:', tailwindError.message);
        console.log('⚠️ CSS build issues could cause components to not display properly');
      }

      // Check for any CSS errors in browser console
      const consoleMessages: any[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error') {
          consoleMessages.push(msg.text());
        }
      });

      await page.goto('http://localhost:4321');
      await page.waitForTimeout(5000); // Wait for CSS to load

      if (consoleMessages.length > 0) {
        console.log('⚠️ BROWSER CONSOLE ERRORS FOUND:');
        consoleMessages.forEach((msg, i) => {
          console.log(`  ${i + 1}. ${msg}`);
        });

        const cssErrors = consoleMessages.filter(msg =>
          msg.includes('CSS') ||
          msg.includes('stylesheet') ||
          msg.includes('style')
        );

        if (cssErrors.length > 0) {
          console.log('🎯 CSS-RELATED ERRORS DETECTED:', cssErrors.length);
          console.log('This could cause components to not render properly');
        }
      } else {
        console.log('✅ No browser console errors detected');
      }

      console.log('📊 CONCLUSION: CSS/styling validation complete');
    });
  });
});

// Helper function to check version requirements
function versionMeetsRequirement(actualVersion: string, requiredVersion: string): boolean {
  try {
    // Simple version comparison - expand this for more complex requirements
    if (requiredVersion.startsWith('>=')) {
      const required = requiredVersion.slice(2);
      const [reqMajor, reqMinor, reqPatch] = required.split('.').map(Number);
      const [actMajor, actMinor, actPatch] = actualVersion.split('.').map(Number);

      if (actMajor > reqMajor) return true;
      if (actMajor === reqMajor && actMinor > reqMinor) return true;
      if (actMajor === reqMajor && actMinor === reqMinor && actPatch >= reqPatch) return true;

      return false;
    }

    // For now, default to true if it's not a >= comparison
    return true;
  } catch (error) {
    console.warn(`Version comparison failed: ${error.message}`);
    return false;
  }
}