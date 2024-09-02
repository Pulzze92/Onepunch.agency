Task: display a large log data (1gb).

Log data should be displayed at boot time.
Automatic scrolling to the bottom of logs should be enabled by default, and there should be a small button, when clicked on which switches automatic scrolling.
The application should consume no more than 512MB of memory.
(Memory usage should not depend on size of log data, recommended to measure after loading all logs).
Memory usage can be checked in the chrome devtools: screenshot
Here is backend: https://github.com/MindesignGCV/test-log-viewer-backend (see readme.md)

Backend is deployed here: https://test-log-viewer-backend.stg.onepunch.agency (cors allowed for localhost)

You can use this backend in your solution.

If functionality of this backend is not enough, you can provide your own backend.

Also, there is frontend implementation (without source code): https://test-log-viewer.stg.onepunch.agency/

Your solution should have same functionality.