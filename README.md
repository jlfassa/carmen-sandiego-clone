# Carmen Sandiego Clone 

A text-based detective adventure game inspired by the classic "Where in the World is Carmen Sandiego?" series. 
## Features

*   **Case-Based Gameplay:** Accept assignments to track down specific thieves who have stolen valuable artifacts.
*   **Global Travel:** Move between various international cities based on clues.
*   **Investigation:** Choose different actions within a city (e.g., check departures, talk to locals) to gather clues about the thief's identity and next destination.
*   **Clue System:** Receive hints about the suspect's characteristics (gender, hobby, hair, etc.) and their next likely location (often presented as a riddle).
*   **Time Limit:** Manage your time wisely! Traveling and investigating consume hours from a limited timeframe.
*   **Warrant System:** Collect enough identity clues to issue an arrest warrant with the correct suspect characteristics.
*   **Capture Mechanic:** Successfully apprehend the thief by reaching their final location with the correct warrant before time runs out.
*   **Retro Terminal UI:** Styled interface reminiscent of classic computer detective games.

## Technologies Used

*   HTML5
*   CSS3 (including CSS Variables, Grid Layout, Flexbox)
*   JavaScript (DOM Manipulation, Event Handling, Game State Management, `data.js` for game content)
*   Google Fonts (`Bebas Neue`, `Poppins`, `IBM Plex Mono`)
*   Font Awesome (for icons)

## Setup and Installation

1.  Clone the repository:
    ```bash
    git clone [Your GitHub Repository Link]
    ```
2.  Navigate into the project directory:
    ```bash
    cd carmen-sandiego-clone # Or your actual folder name
    ```
3.  Open the `index.html` file in your web browser.

## How to Play

1.  Load `index.html`.
2.  Click "Accept New Case" to receive your assignment.
3.  **Travel:** The first action is usually traveling to the starting city. Click the travel button.
4.  **Investigate:** Once in a city, choose investigation options to gather clues. You have a limited number of investigations per city. Pay attention to clues about the suspect's appearance/habits (for the warrant) and hints about their next stop.
5.  **Deduce & Travel:** When you're out of investigations or feel you have a good lead, click "Proceed to Travel". Read the destination riddle/summary provided, then select the city you believe the thief fled to from the options. Incorrect travel wastes significant time!
6.  **Warrant:** Once you have gathered enough identity clues, click "Issue Arrest Warrant". Fill out the details based on your clues and submit. You only get one chance to issue the warrant per case!
7.  **Capture:** Follow the trail to the thief's final location. If you arrive there with the *correct* warrant issued *before* time runs out, you win the case! If time runs out, or you arrive with an incorrect warrant, the thief escapes.
8.  Click "Start New Case" to play again.

