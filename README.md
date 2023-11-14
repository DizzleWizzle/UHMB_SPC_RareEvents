# UHMB_SPC_RareEvents
UHMB Rare Event SPC chart extension (T and G Chart) developed in house at UHMB, split off from the XMR and XMR Scorecard extensions

Dimensions:
1. Event ID - not currently used in the extension but useful for events that may happen on the same date
2. Date - Used for x axis in both T and G, for T Charts used to generate the y values
Measures:
1. number of non signal events since last signaling event. Only use for G Chart, if using a T chart can put anything in here that wont affect the dimesions (e.g =1 ) 
2. (optional) Recalculation ID: If populated will group calculations based on the rows with the same recalculation ID, these must be contiguous or strangeness will ensue.


SPC Options:
- T or G Chart
  - if T Chart the option to choose Days(midnights), Hours or Minutes between events
- Use Baseline & size of baseline

Formatting:
- Date Tick Seperation - minimum number pixels between ticks on the x-axis 
- Hide/Show Labels
- Hide X Axis
- Date format for X Axis (see d3.js docs)
- Whether to show the Recalc coloured areas or not
- Array of Colours for the recalc periods
- Width of the definition table
- DQ Icons

