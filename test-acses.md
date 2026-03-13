# Manual Verification Plan - 15 Scenarios

To ensure the app is 100% accurate, please verify these 15 scenarios. 
**Note**: These assume the default "Full Day" is **8h 15m** and "Half Day" is **4h 15m**.

| Scenario | Arrival Time | Work Mode | Break Mode | Break Input | **Expected Goal** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | 09:00 AM | Full Day | Duration | 00h 45m | **06:00 PM** |
| 2 | 10:50 AM | Full Day | Duration | 01h 30m | **08:35 PM** |
| 3 | 08:00 AM | Full Day | Range | 12:00 PM - 01:00 PM | **05:15 PM** |
| 4 | 07:30 AM | Half Day | Duration | 00h 15m | **12:00 PM** |
| 5 | 01:00 PM | Half Day | Duration | 01h 00m | **06:15 PM** |
| 6 | 09:00 AM | Full Day | Duration | 30m, 15m, 15m (3 breaks) | **06:15 PM** |
| 7 | 08:30 AM | Full Day | Range | 11:00 AM-11:30 AM & 02:00 PM-03:00 PM | **06:15 PM** |
| 8 | 09:17 AM | Full Day | Duration | 00h 23m | **05:55 PM** |
| 9 | 04:00 PM | Full Day | Duration | 01h 00m | **01:15 AM (Next Day)** |
| 10 | 08:45 AM | Full Day | Duration | 00h 00m | **05:00 PM** |
| 11 | 09:00 AM | Half Day | Duration | 00h 45m | **02:00 PM** |
| 12 | 11:45 AM | Full Day | Duration | 00h 30m | **08:30 PM** |
| 13 | 10:00 AM | Full Day | Range | 11:45 AM - 12:45 PM | **07:15 PM** |
| 14 | 09:00 AM | Custom Shift* | - | (Set Full Day to 9h 00m in Settings) | **06:00 PM** |
| 15 | 11:59 PM | Half Day | Duration | 00h 01m | **04:15 AM (Next Day)** |

---

# Debugging the Test Failure
The error `Cannot find native binding` for `@rolldown` is a known environment issue on some Linux setups where optional dependencies fail to install correctly. 

I am attempting to fix this, but if it persists, I will migrate the tests to **Jest**, which is more broadly compatible with environments that have strict module binding restrictions.

# Fixing the UI Error
I've detected a syntax error in [TimeCalculator.jsx](file:///home/faizan/learning_playground/work-time-calculator/components/TimeCalculator.jsx) that appeared after the last update (possibly a dangling bracket or quote). I am fixing it now.
