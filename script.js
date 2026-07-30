// Wait for DOM to load fully before running script
document.addEventListener('DOMContentLoaded', () => {

    // 1. Select DOM Elements
    const navHome = document.getElementById('nav-home');
    const navMap = document.getElementById('nav-map');
    const navProfile = document.getElementById('nav-profile');
    
    const bottomSheet = document.getElementById('bottom-sheet');
    const toggleDescBtn = document.getElementById('toggle-desc-btn');
    const btnCrowd = document.getElementById('btn-crowd');
    const crowdOverlay = document.getElementById('crowd-overlay');
    const searchBar = document.querySelector('.search-bar');
    const mapImage = document.getElementById('map-image');

    // Hotspot Card Elements
    const hotspotCard = document.getElementById('hotspot-card');
    const cardTitle = document.getElementById('card-title');
    const cardCause = document.getElementById('card-cause');
    const cardLevel = document.getElementById('card-level');
    const closeCardBtn = document.getElementById('close-card-btn');

    // 2. Data Sources for Different Views
    const defaultMapData = {
        description: `
            <h3>Metro Manila Traffic & Crowd Overview</h3>
            <p>Overall crowd density is moderate across major transit corridors. High congestion is concentrated around main interchange hubs during peak evening hours (5:00 PM - 8:00 PM).</p>
        `,
        points: [
            { top: '30%', left: '35%', type: 'heavy', name: 'Manila City Center', cause: 'High foot traffic near LRT station and university grounds.' },
            { top: '55%', left: '60%', type: 'heavy', name: 'Makati CBD', cause: 'Peak rush-hour traffic surrounding shopping malls and bus terminals.' },
            { top: '42%', left: '70%', type: 'medium', name: 'Mandaluyong Interchange', cause: 'Moderate congestion near MRT transfer dock.' },
            { top: '70%', left: '45%', type: 'medium', name: 'Pasay Hub', cause: 'Provincial bus boarding and jeepney terminal queue lines.' },
            { top: '68%', left: '65%', type: 'heavy', name: 'BGC High Street', cause: 'Heavy evening leisure crowd around retail stores.' }
        ]
    };

    const taftMapData = {
        description: `
            <h3>Taft Avenue Local Overview</h3>
            <p>Taft Avenue (Filipino: Abenida Taft; Spanish: Avenida Taft) is a major road in southern Metro Manila. It passes through three cities in the metropolis: Manila, Pasay, and Parañaque.</p>
        `,
        points: [
            { top: '35%', left: '48%', type: 'medium', name: 'DLSU Manila Gate', cause: 'Standard class dismissal queue near university main entry.' },
            { top: '52%', left: '50%', type: 'surge', name: 'Vito Cruz LRT Station', cause: 'NEW SURGE: Unscheduled train interval delay causing a sudden platform backup.' },
            { top: '68%', left: '52%', type: 'surge', name: 'Taft - Quirino Ave Junction', cause: 'NEW SURGE: Sudden heavy rain causing sudden commuter buildup at jeepney stops.' }
        ]
    };

    // Current active dataset pointer
    let currentData = defaultMapData;

    // 3. Navigation Click Listeners
    navHome.addEventListener('click', () => showScreen('home-screen'));
    navMap.addEventListener('click', () => showScreen('map-screen'));
    navProfile.addEventListener('click', () => showScreen('profile-screen'));

    // 4. Search Bar Listener (Taft Avenue Detection)
    if (searchBar) {
        searchBar.addEventListener('input', (e) => {
            const query = e.target.value.trim().toLowerCase();

            if (query === 'taft avenue') {
                // Switch image source and dataset for Taft Avenue
                mapImage.src = 'Images/map2.png';
                currentData = taftMapData;

                // Reload map and re-render if Crowd Density button is active
                loadMapContents(() => {
                    if (btnCrowd && btnCrowd.classList.contains('active')) {
                        renderCrowdDots();
                    }
                });
            } else if (query === '' && mapImage.src.includes('map2.png')) {
                // Reset back to default map if search input is cleared
                mapImage.src = 'Images/map1.png';
                currentData = defaultMapData;

                loadMapContents(() => {
                    if (btnCrowd && btnCrowd.classList.contains('active')) {
                        renderCrowdDots();
                    }
                });
            }
        });
    }

    // 5. Toggle Bottom Drawer
    if (toggleDescBtn && bottomSheet) {
        toggleDescBtn.addEventListener('click', () => {
            bottomSheet.classList.toggle('open');
        
            const isOpen = bottomSheet.classList.contains('open');
            toggleDescBtn.textContent = isOpen ? 'Hide Description' : 'View Description';

            const descContent = document.getElementById('location-description');
            const descLoading = document.getElementById('description-loading');
        
            if (isOpen && descContent) {
                if (descLoading) descLoading.style.display = 'none';
                descContent.innerHTML = currentData.description; // Injects description when manually toggling drawer
                descContent.style.display = 'block';
            }
        });
    }

    // 6. Crowd Density Button Click Event
    if (btnCrowd) {
        btnCrowd.addEventListener('click', () => {
            const isActive = btnCrowd.classList.toggle('active');

            if (isActive) {
                loadMapContents(() => renderCrowdDots());
            } else {
                clearCrowdDots();
            }
        });
    }

    // 7. Close Hotspot Card Listener
    if (closeCardBtn) {
        closeCardBtn.addEventListener('click', () => {
            if (hotspotCard) hotspotCard.classList.remove('active');
        });
    }

    // 8. Main Navigation Function
    function showScreen(screenId) {
        const screens = document.querySelectorAll('.screen');
        screens.forEach(screen => screen.style.display = 'none');

        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => item.classList.remove('active'));

        document.getElementById(screenId).style.display = 'flex';

        if (screenId === 'home-screen') {
            navHome.classList.add('active');
        } else if (screenId === 'map-screen') {
            navMap.classList.add('active');
            loadMapContents();
        } else if (screenId === 'profile-screen') {
            navProfile.classList.add('active');
        }
    }

    // 9. Map Reload Sequence
    function loadMapContents(onComplete) {
        const mapLoading = document.getElementById('map-loading');
        const descLoading = document.getElementById('description-loading');
        const descContent = document.getElementById('location-description');

        clearCrowdDots();
        if (mapLoading) mapLoading.style.display = 'flex';
        if (mapImage) mapImage.classList.remove('loaded');
        if (descLoading) descLoading.style.display = 'flex';
        if (descContent) descContent.style.display = 'none';

        setTimeout(() => {
            if (mapLoading) mapLoading.style.display = 'none';
            if (mapImage) mapImage.classList.add('loaded');

            if (onComplete) {
                setTimeout(onComplete, 800);
            }
        }, 1200);

        setTimeout(() => {
            if (descLoading) descLoading.style.display = 'none';
            if (descContent) {
                descContent.innerHTML = currentData.description; // FIX 1: Dynamically updates description text box
                descContent.style.display = 'block';
            }
        }, 2000);
    }

    // 10. Hotspot Info Card Display Logic
    function showHotspotCard(info) {
        if (!hotspotCard) return;
        
        cardTitle.textContent = info.name;
        cardCause.textContent = info.cause;
        
        // Show SURGE or DENSITY label depending on dot type
        const labelText = info.type === 'surge' ? 'SUDDEN SURGE' : `${info.type.toUpperCase()} DENSITY`;
        cardLevel.textContent = labelText;
        cardLevel.className = `card-level ${info.type}`;

        hotspotCard.classList.add('active');
    }

    // 11. Crowd Dots Render & Clear Logic
    function renderCrowdDots() {
        clearCrowdDots();

        // FIX 2: Switched from currentData.forEach to currentData.points.forEach
        currentData.points.forEach((point, index) => {
            const dot = document.createElement('div');
            dot.classList.add('crowd-dot', point.type);
            dot.style.top = point.top;
            dot.style.left = point.left;

            dot.addEventListener('mouseenter', () => showHotspotCard(point));
            dot.addEventListener('click', () => showHotspotCard(point));

            crowdOverlay.appendChild(dot);

            setTimeout(() => {
                dot.classList.add('visible');
            }, index * 100);
        });
    }

    function clearCrowdDots() {
        if (crowdOverlay) crowdOverlay.innerHTML = '';
        if (hotspotCard) hotspotCard.classList.remove('active');
    }

    const badgeTaft = document.getElementById('badge-taft');

    if (badgeTaft) {
        badgeTaft.addEventListener('click', () => {
            // 1. Switch active map dataset and image source to Taft Avenue
            mapImage.src = 'Images/map2.png';
            currentData = taftMapData;

            // 2. Switch to the Map Screen
            showScreen('map-screen');

            // 3. Sync search bar text
            if (searchBar) {
                searchBar.value = 'Taft Avenue';
            }

            // 4. Activate Crowd Density button
            if (btnCrowd) {
                btnCrowd.classList.add('active');
            }

            // 5. Open the bottom sheet drawer (matching the 'open' class used in section 5)
            if (bottomSheet) {
                bottomSheet.classList.add('open');
            }
            if (toggleDescBtn) {
                toggleDescBtn.textContent = 'Hide Description';
            }

            // 6. Reload map and render Taft Avenue crowd dots
            loadMapContents(() => {
                renderCrowdDots();
            });
        });
    }
    // Initial setup: Launch on Home screen
    showScreen('home-screen');
});