(function() {
    // Main function for the interactive box model highlighter
    function interactiveBoxModelHighlighter() {
        // First, clear all previous highlights, popovers, and the initial modal
        clearAllHighlightsAndPopovers();

        // Define CSS styles for new elements
        const style = document.createElement('style');
        style.innerHTML = `
            /* Style for the shadow/border layer placed over the element */
            .highlight-overlay-shadow {
                position: absolute;
                pointer-events: none; /* Allow clicks to pass through to the element below */
                z-index: 9998; /* Slightly below the question icon */
                box-shadow: 0 0 0 0px rgba(255, 0, 0, 0); /* Start with transparent border */
                opacity: 0; /* Start hidden */
                transition: box-shadow 0.2s ease-in-out, opacity 0.2s ease-in-out; /* Smooth animation */
            }

            /* Style for the question mark icon */
            .highlight-question-icon {
                position: absolute;
                background-color: #333;
                color: white;
                font-size: 10px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                z-index: 9999; /* Above the shadow layer */
                font-family: 'Inter', sans-serif;
                box-shadow: 0 0 5px rgba(0,0,0,0.5);
                opacity: 0; /* Start hidden */
                transition: opacity 0.2s ease-in-out; /* Smooth animation */
            }
            .highlight-question-icon:hover {
                background-color: #555;
            }

            /* Style for the details popover */
            .highlight-details-popover {
                position: fixed; /* Fixed position relative to the viewport */
                background-color: rgba(0, 0, 0, 0.9);
                color: white;
                padding: 10px;
                border-radius: 5px;
                font-size: 12px;
                z-index: 10000; /* Highest z-index */
                max-width: 280px;
                box-shadow: 0 0 15px rgba(0,0,0,0.8);
                font-family: 'Inter', sans-serif;
                pointer-events: auto; /* To allow clicking and scrolling */
                line-height: 1.5;
                text-align: left;
                opacity: 0; /* Start hidden */
                transition: opacity 0.2s ease-in-out; /* Smooth animation */
            }
            .highlight-details-popover p {
                margin: 0;
                padding: 0;
                margin-bottom: 5px;
            }
            .highlight-details-popover p:last-child {
                margin-bottom: 0;
            }
            .highlight-details-popover strong {
                color: #aaffaa; /* Light green color for titles */
            }
            .highlight-details-popover .close-button {
                position: absolute;
                top: 5px;
                right: 8px;
                color: white;
                font-size: 18px;
                cursor: pointer;
                background: none;
                border: none;
                padding: 0;
                line-height: 1;
                font-weight: bold;
            }
            .highlight-details-popover .close-button:hover {
                color: #ff4d4d;
            }

            /* Style for the initial welcome modal */
            .initial-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(5px); /* Blur effect */
                z-index: 10000;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .initial-modal-content {
                background-color: #222;
                color: white;
                padding: 25px;
                border-radius: 8px;
                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
                text-align: center;
                max-width: 400px;
                width: 90%;
                font-family: 'Inter', sans-serif;
                position: relative;
            }
            .initial-modal-content h3 {
                margin-top: 0;
                color: #aaffaa;
            }
            .initial-modal-content p {
                margin-bottom: 20px;
            }
            .initial-modal-content button {
                background-color: #007bff;
                color: white;
                border: none;
                padding: 10px 20px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 16px;
                transition: background-color 0.2s ease;
            }
            .initial-modal-content button:hover {
                background-color: #0056b3;
            }
            .initial-modal-content .close-button-modal {
                position: absolute;
                top: 10px;
                right: 15px;
                color: #aaa;
                font-size: 24px;
                cursor: pointer;
            }
            .initial-modal-content .close-button-modal:hover {
                color: white;
            }
        `;
        document.head.appendChild(style);

        // Store references to highlighted elements for cleanup
        const activeHighlights = [];
        let currentPopover = null; // To keep track of the currently open popover

        // Regex patterns for identifying Bootstrap spacing classes
        const bootstrapSpacingPatterns = [
            /^m-[0-5]|auto$/, /^p-[0-5]|auto$/,
            /^mt-[0-5]|auto$/, /^mb-[0-5]|auto$/, /^ml-[0-5]|auto$/, /^mr-[0-5]|auto$/,
            /^mx-[0-5]|auto$/, /^my-[0-5]|auto$/,
            /^pt-[0-5]|auto$/, /^pb-[0-5]|auto$/, /^pl-[0-5]|auto$/, /^pr-[0-5]|auto$/,
            /^px-[0-5]|auto$/, /^py-[0-5]|auto$/,
            /^ms-[0-5]|auto$/, /^me-[0-5]|auto$/,
            /^ps-[0-5]|auto$/, /^pe-[0-5]|auto$/
        ];

        // Helper function to find a specific Bootstrap class for a property
        function findSpecificBootstrapClass(elementClassesArray, prop) {
            let patterns = [];
            switch (prop) {
                case 'marginTop':    patterns = [/^mt-[0-5]|auto$/, /^my-[0-5]|auto$/, /^m-[0-5]|auto$/]; break;
                case 'marginBottom': patterns = [/^mb-[0-5]|auto$/, /^my-[0-5]|auto$/, /^m-[0-5]|auto$/]; break;
                case 'marginLeft':   patterns = [/^ml-[0-5]|auto$/, /^mx-[0-5]|auto$/, /^m-[0-5]|auto$/, /^ms-[0-5]|auto$/]; break;
                case 'marginRight':  patterns = [/^mr-[0-5]|auto$/, /^mx-[0-5]|auto$/, /^m-[0-5]|auto$/, /^me-[0-5]|auto$/]; break;
                case 'paddingTop':   patterns = [/^pt-[0-5]|auto$/, /^py-[0-5]|auto$/, /^p-[0-5]|auto$/]; break;
                case 'paddingBottom':patterns = [/^pb-[0-5]|auto$/, /^py-[0-5]|auto$/, /^p-[0-5]|auto$/]; break;
                case 'paddingLeft':  patterns = [/^pl-[0-5]|auto$/, /^px-[0-5]|auto$/, /^p-[0-5]|auto$/, /^ps-[0-5]|auto$/]; break;
                case 'paddingRight': patterns = [/^pr-[0-5]|auto$/, /^px-[0-5]|auto$/, /^p-[0-5]|auto$/, /^pe-[0-5]|auto$/]; break;
            }
            for (const cls of elementClassesArray) {
                for (const pattern of patterns) {
                    if (pattern.test(cls)) {
                        return cls;
                    }
                }
            }
            return null;
        }

        // Function to display the details popover
        function showDetailsPopover(el, icon) {
            // Clear previous popovers
            if (currentPopover) {
                currentPopover.remove();
                currentPopover = null;
            }

            const computedStyle = getComputedStyle(el);
            const elementClassesArray = el.getAttribute('class') ? el.getAttribute('class').split(' ').filter(c => c !== '') : [];

            let detailsHTML = '';

            // Margin details
            const margins = ['Top', 'Right', 'Bottom', 'Left'];
            margins.forEach(side => {
                const value = parseFloat(computedStyle[`margin${side}`]);
                if (value > 0) {
                    const specificClass = findSpecificBootstrapClass(elementClassesArray, `margin${side}`);
                    const classText = specificClass ? ` (Bootstrap: ${specificClass})` : '';
                    detailsHTML += `<p><strong>Margin ${side}:</strong> ${value}px${classText}</p>`;
                }
            });

            // Padding details
            const paddings = ['Top', 'Right', 'Bottom', 'Left'];
            paddings.forEach(side => {
                const value = parseFloat(computedStyle[`padding${side}`]);
                if (value > 0) {
                    const specificClass = findSpecificBootstrapClass(elementClassesArray, `padding${side}`);
                    const classText = specificClass ? ` (Bootstrap: ${specificClass})` : '';
                    detailsHTML += `<p><strong>Padding ${side}:</strong> ${value}px${classText}</p>`;
                }
            });

            if (detailsHTML === '') {
                detailsHTML = '<p>This element does not have Bootstrap margin or padding.</p>';
            }
            
            const popover = document.createElement('div');
            popover.className = 'highlight-details-popover';
            popover.innerHTML = `
                <button class="close-button">&times;</button>
                ${detailsHTML}
            `;
            document.body.appendChild(popover);
            currentPopover = popover; // Set current popover

            // Position the popover relative to the icon and considering the viewport
            const iconRect = icon.getBoundingClientRect();
            const popoverRect = popover.getBoundingClientRect(); // Get the dimensions of the popover itself
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            let popoverLeft = iconRect.right + 10;
            let popoverTop = iconRect.top;

            // Adjust horizontal position
            if (popoverLeft + popoverRect.width > viewportWidth - 10) {
                // If it goes off the right edge, move it to the left of the icon
                popoverLeft = iconRect.left - popoverRect.width - 10;
                if (popoverLeft < 10) popoverLeft = 10; // Ensure it doesn't go off the left edge either
            }

            // Adjust vertical position
            if (popoverTop + popoverRect.height > viewportHeight - 10) {
                // If it goes off the bottom, move it upwards
                popoverTop = viewportHeight - popoverRect.height - 10;
                if (popoverTop < 10) popoverTop = 10; // Ensure it doesn't go off the top either
            } else if (popoverTop < 10) {
                // If it goes off the top, move it downwards
                popoverTop = 10;
            }
            
            popover.style.left = `${popoverLeft}px`;
            popover.style.top = `${popoverTop}px`;
            popover.style.opacity = 1; // Make it visible with animation

            // Close popover by clicking on the close button
            popover.querySelector('.close-button').addEventListener('click', (e) => {
                e.stopPropagation();
                popover.remove();
                currentPopover = null;
            });

            // Add mouseleave listener for the popover itself
            let popoverLeaveTimeout;
            popover.addEventListener('mouseleave', () => {
                popoverLeaveTimeout = setTimeout(() => {
                    popover.remove();
                    currentPopover = null;
                }, 150); // Small delay
            });

            // If mouse re-enters popover, clear the timeout
            popover.addEventListener('mouseenter', () => {
                clearTimeout(popoverLeaveTimeout);
            });
        }

        // Select all elements on the page
        const elements = document.querySelectorAll('body *');

        elements.forEach(el => {
            // Prevent processing of the script itself and injected elements
            if (el.classList.contains('highlight-overlay-shadow') || el.classList.contains('highlight-question-icon') || el.classList.contains('highlight-details-popover') || el.classList.contains('initial-modal-overlay') || el.classList.contains('initial-modal-content')) {
                return;
            }

            const computedStyle = getComputedStyle(el);
            const hasMarginOrPadding =
                parseFloat(computedStyle.marginTop) > 0 ||
                parseFloat(computedStyle.marginBottom) > 0 ||
                parseFloat(computedStyle.marginLeft) > 0 ||
                parseFloat(computedStyle.marginRight) > 0 ||
                parseFloat(computedStyle.paddingTop) > 0 ||
                parseFloat(computedStyle.paddingBottom) > 0 ||
                parseFloat(computedStyle.paddingLeft) > 0 ||
                parseFloat(computedStyle.paddingRight) > 0;

            if (hasMarginOrPadding) {
                // Create shadow/border layer
                const shadowDiv = document.createElement('div');
                shadowDiv.className = 'highlight-overlay-shadow';
                document.body.appendChild(shadowDiv);

                // Create question mark icon
                const questionIcon = document.createElement('div');
                questionIcon.className = 'highlight-question-icon';
                questionIcon.innerText = '?';
                document.body.appendChild(questionIcon);

                // Store reference for cleanup
                activeHighlights.push({ el, shadowDiv, questionIcon });

                // Function to update element positions on the page (for scroll and window resize)
                function updatePosition() {
                    const rect = el.getBoundingClientRect();
                    shadowDiv.style.left = (rect.left + window.scrollX) + 'px';
                    shadowDiv.style.top = (rect.top + window.scrollY) + 'px';
                    shadowDiv.style.width = rect.width + 'px';
                    shadowDiv.style.height = rect.height + 'px';
                    questionIcon.style.left = (rect.right + window.scrollX - 8) + 'px'; // Adjust for better positioning
                    questionIcon.style.top = (rect.top + window.scrollY - 8) + 'px'; // Adjust for better positioning
                }

                // Set initial position
                updatePosition();

                // Add event listener for hover and click
                el.addEventListener('mouseenter', () => {
                    updatePosition(); // Ensure correct position on hover
                    shadowDiv.style.opacity = 1;
                    shadowDiv.style.boxShadow = '0 0 0 3px red'; // Stronger border
                    questionIcon.style.opacity = 1;
                });

                let elementLeaveTimeout;
                el.addEventListener('mouseleave', () => {
                    // Hide with a small delay to prevent flickering
                    elementLeaveTimeout = setTimeout(() => {
                        shadowDiv.style.opacity = 0;
                        shadowDiv.style.boxShadow = 'none'; // Hide border
                        questionIcon.style.opacity = 0;
                    }, 100); // 100 milliseconds delay
                });

                // --- Changed from click to mouseenter for popover ---
                questionIcon.addEventListener('mouseenter', () => {
                    clearTimeout(elementLeaveTimeout); // Clear timeout if mouse enters icon from element
                    shadowDiv.style.opacity = 1; // Ensure border and shadow are shown again
                    shadowDiv.style.boxShadow = '0 0 0 3px red';
                    questionIcon.style.opacity = 1;
                    showDetailsPopover(el, questionIcon);
                });

                let iconLeaveTimeout;
                questionIcon.addEventListener('mouseleave', () => {
                    iconLeaveTimeout = setTimeout(() => {
                        shadowDiv.style.opacity = 0;
                        shadowDiv.style.boxShadow = 'none';
                        questionIcon.style.opacity = 0;
                        if (currentPopover) {
                            currentPopover.remove();
                            currentPopover = null;
                        }
                    }, 150); // Small delay to allow moving to popover
                });

                // If mouse re-enters icon from popover, clear the timeout
                questionIcon.addEventListener('mouseenter', () => {
                    clearTimeout(iconLeaveTimeout);
                });
                // --- End of change ---

                // Track scroll and window resize for position updates
                window.addEventListener('scroll', updatePosition);
                window.addEventListener('resize', updatePosition);
                
                // Store listeners for cleanup (simplified, actual listener cleanup might be more complex for preserved original events)
                shadowDiv.__listeners = {
                    scroll: updatePosition,
                    resize: updatePosition,
                };
            }
        });
    }

    // Function to clear all highlights, popovers, and injected styles
    function clearAllHighlightsAndPopovers() {
        document.querySelectorAll('.highlight-overlay-shadow').forEach(div => {
            const listeners = div.__listeners;
            if (listeners) {
                window.removeEventListener('scroll', listeners.scroll);
                window.removeEventListener('resize', listeners.resize);
            }
            div.remove();
        });
        document.querySelectorAll('.highlight-question-icon').forEach(icon => icon.remove());
        document.querySelectorAll('.highlight-details-popover').forEach(pop => pop.remove());
        document.querySelectorAll('.initial-modal-overlay').forEach(overlay => overlay.remove()); // Remove initial modal overlay

        const existingStyleTag = document.querySelector('style:has(.highlight-overlay-shadow)');
        if (existingStyleTag) {
            existingStyleTag.remove();
        }
    }

    // Function to show the initial welcome modal
    function showInitialWelcomeModal() {
        if (document.querySelector('.initial-modal-overlay')) {
            return; // Only show once per script execution
        }

        const overlay = document.createElement('div');
        overlay.className = 'initial-modal-overlay';
        document.body.appendChild(overlay);

        const modalContent = document.createElement('div');
        modalContent.className = 'initial-modal-content';
        modalContent.innerHTML = `
            <span class="close-button-modal">&times;</span>
            <h3>Welcome!</h3>
            <p>Hello! I am Mohammad Beyramijam, the creator of this tool.</p>
            <button id="githubRepoButton">View other repositories on GitHub</button>
        `;
        overlay.appendChild(modalContent);

        // Add event listener for the GitHub button
        document.getElementById('githubRepoButton').addEventListener('click', () => {
            window.open('https://github.com/Lucifer-ir', '_blank');
        });

        // Add event listener for the close button
        modalContent.querySelector('.close-button-modal').addEventListener('click', () => {
            overlay.remove();
        });

        // Close modal if clicked outside (but not on content itself)
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.remove();
            }
        });
    }

    // Execute the main function on script load
    interactiveBoxModelHighlighter();
    showInitialWelcomeModal(); // Show welcome modal immediately

    // For development convenience, add a global clear function (optional)
    window.clearInteractiveHighlights = clearAllHighlightsAndPopovers;

})();
