document.addEventListener("DOMContentLoaded", function() {
    const bookingDateInput = document.getElementById("bookingDate");
    const buttons = document.querySelectorAll(".slot-button");
    const hostelSelect = document.getElementById("hostelSelect");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const mySlotsContainer = document.getElementById("mySlotsContainer");
    const bookedSlotsContainer = document.getElementById("bookedSlotsContainer");
    const hostelManagementContainer = document.getElementById("hostelManagementContainer");
    const hostelBookingsContainer = document.getElementById("hostelBookingsContainer");
    const profilePhoto = document.getElementById("profile-photo");
    const profilePhotoLarge = document.getElementById("profile-photo-large");
    const reviewText = document.getElementById("review-text");
    const captchaText = document.getElementById("captcha-text");
    let currentUser = null;
    let isMessCommittee = false;

    let bookedSlots = loadFromLocalStorage("bookedSlots") || {};
    let users = loadFromLocalStorage("users") || {};
    let hostels = loadFromLocalStorage("hostels") || [
        { name: "Vishwasaraya Bhawan", capacity: 500 },
        { name: "Tagore Bhawan", capacity: 500 },
        { name: "Tilak Bhawan", capacity: 160 },
        { name: "New Girls Hostel", capacity: 200 }
    ];

    bookingDateInput.valueAsDate = new Date();
    bookingDateInput.addEventListener("change", updateSlotAvailability);

    function loadFromLocalStorage(key) {
        try {
            return JSON.parse(localStorage.getItem(key));
        } catch (error) {
            console.error(`Error loading ${key} from localStorage:`, error);
            return null;
        }
    }

    function saveToLocalStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error(`Error saving ${key} to localStorage:`, error);
        }
    }

    function updateSlotAvailability() {
        const selectedDate = bookingDateInput.value;
        const currentTime = new Date();
        const selectedDateTime = new Date(selectedDate);

        buttons.forEach(button => {
            const time = button.getAttribute("data-time");
            const [startHour, startMinute] = time.split(" - ")[0].split(":").map(Number);
            const [endHour, endMinute] = time.split(" - ")[1].split(":").map(Number);
            const slotStartTime = new Date(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate(), startHour, startMinute);
            const slotEndTime = new Date(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate(), endHour, endMinute);

            const isBooked = bookedSlots[currentUser]?.[selectedDate]?.includes(time);
            const isPast = currentTime > slotEndTime;

            button.disabled = isBooked || isPast;
            button.classList.toggle("booked", isBooked || isPast);
            button.innerText = isBooked ? "Booked" : isPast ? "Past" : `Book ${time}`;
        });
    }

    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const selectedDate = bookingDateInput.value;
            const meal = this.getAttribute("data-meal");
            const time = this.getAttribute("data-time");
            const hostel = hostelSelect.value;

            if (!bookedSlots[currentUser]) {
                bookedSlots[currentUser] = {};
            }

            if (!bookedSlots[currentUser][selectedDate]) {
                bookedSlots[currentUser][selectedDate] = [];
            }

            if (bookedSlots[currentUser][selectedDate].includes(time)) {
                alert("This slot is already booked for this day.");
                return;
            }

            if (bookedSlots[currentUser][selectedDate].some(slot => slot.split(" - ")[0] === time.split(" - ")[0])) {
                alert(`You have already booked a slot for ${meal} on this day.`);
                return;
            }

            const confirmBooking = confirm(`Do you want to book the ${meal} slot at ${time} in ${hostel} on ${selectedDate}?`);
            if (confirmBooking) {
                this.disabled = true;
                this.innerText = "Booked";
                this.classList.add("booked");
                bookedSlots[currentUser][selectedDate].push(time);
                saveToLocalStorage("bookedSlots", bookedSlots);
                showPopup(`Your slot for ${meal} at ${time} has been booked.`);
                updateMySlots();
                updateHostelBookings();
            }
        });
    });

    function showPopup(message) {
        const popup = document.createElement("div");
        popup.className = "popup";
        popup.innerText = message;
        document.body.appendChild(popup);

        setTimeout(() => {
            popup.classList.add("show");
        }, 100);

        setTimeout(() => {
            popup.classList.remove("show");
            setTimeout(() => popup.remove(), 300);
        }, 3000);
    }

    window.toggleSection = function(sectionId) {
        const section = document.getElementById(sectionId);
        const arrow = section.querySelector(".arrow");
        if (section.style.display === "block") {
            section.style.display = "none";
            section.classList.remove("show");
            arrow.classList.remove("rotated");
        } else {
            section.style.display = "block";
            setTimeout(() => {
                section.classList.add("show");
                arrow.classList.add("rotated");
            }, 100);
        }
    };

    window.showRegisterForm = function() {
        document.getElementById("login-form").style.display = "none";
        document.getElementById("register-form").style.display = "block";
    };

    window.showLoginForm = function() {
        document.getElementById("register-form").style.display = "none";
        document.getElementById("login-form").style.display = "block";
    };

    window.showMessCommitteeForm = function() {
        document.getElementById("login-form").style.display = "none";
        document.getElementById("mess-committee-form").style.display = "block";
    };

    window.login = function() {
        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        const captcha = document.getElementById("login-captcha").value;

        if (captcha !== captchaText.innerText) {
            alert("Invalid CAPTCHA. Please try again.");
            return;
        }

        if (users[email] && users[email].password === password) {
            currentUser = email;
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("main-container").style.display = "block";
            profilePhoto.src = users[email].profilePicture;
            profilePhotoLarge.src = users[email].profilePicture;
            updateSlotAvailability();
            updateHostelOptions();
            updateMySlots();
        } else {
            alert("Invalid credentials. Please try again.");
        }
    };

    window.register = function() {
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        const name = document.getElementById("register-name").value;
        const gender = document.getElementById("register-gender").value;
        const rollNumber = document.getElementById("register-roll-number").value;
        const profilePicture = document.getElementById("register-profile-picture").files[0];

        if (email && password && name && gender && rollNumber && profilePicture) {
            if (users[email]) {
                alert("User already exists! Please log in.");
                return;
            }

            const reader = new FileReader();
            reader.onload = function(event) {
                const profilePictureData = event.target.result;
                users[email] = { name, password, gender, rollNumber, profilePicture: profilePictureData };
                saveToLocalStorage("users", users);
                alert("Registration successful! Please log in.");
                showLoginForm();
            };
            reader.readAsDataURL(profilePicture);
        } else {
            alert("Please enter valid credentials.");
        }
    };

    window.togglePassword = function(inputId) {
        const passwordInput = document.getElementById(inputId);
        const toggleButton = passwordInput.nextElementSibling;

        if (passwordInput.type === "password") {
            passwordInput.type = "text";
            toggleButton.innerText = "🙉";
        } else {
            passwordInput.type = "password";
            toggleButton.innerText = "🙈";
        }
    };

    darkModeToggle.addEventListener("click", function() {
        document.body.classList.toggle("dark-mode");
        darkModeToggle.textContent = document.body.classList.contains("dark-mode") ? "🌞" : "🌙";
    });

    function updateHostelOptions() {
        const userGender = users[currentUser]?.gender;
        const hostelOptions = hostelSelect.options;

        for (let option of hostelOptions) {
            if ((userGender === "female" && option.value !== "NewGirls") ||
                (userGender === "male" && option.value === "NewGirls")) {
                option.disabled = true;
            } else {
                option.disabled = false;
            }
        }
    }

    function updateMySlots() {
        mySlotsContainer.innerHTML = "";
        if (bookedSlots[currentUser]) {
            for (const date in bookedSlots[currentUser]) {
                const slots = bookedSlots[currentUser][date];
                slots.forEach(slot => {
                    const p = document.createElement("p");
                    p.innerText = `Booked ${slot} on ${date}`;
                    const deleteButton = document.createElement("button");
                    deleteButton.innerText = "Delete";
                    deleteButton.addEventListener("click", function() {
                        const index = bookedSlots[currentUser][date].indexOf(slot);
                        if (index > -1) {
                            const currentTime = new Date();
                            const selectedDateTime = new Date(date);
                            const [startHour, startMinute] = slot.split(" - ")[0].split(":").map(Number);
                            const slotStartTime = new Date(selectedDateTime.getFullYear(), selectedDateTime.getMonth(), selectedDateTime.getDate(), startHour, startMinute);

                            if (currentTime > slotStartTime) {
                                alert("You cannot delete a slot that has already passed.");
                                return;
                            }

                            bookedSlots[currentUser][date].splice(index, 1);
                            saveToLocalStorage("bookedSlots", bookedSlots);
                            showPopup(`Your slot for ${slot} on ${date} has been deleted.`);
                            updateMySlots();
                            updateSlotAvailability();
                            updateHostelBookings();
                        }
                    });
                    p.appendChild(deleteButton);
                    mySlotsContainer.appendChild(p);
                });
            }
        }
    }

    window.messCommitteeLogin = function() {
        const email = document.getElementById("mess-committee-email").value;
        const password = document.getElementById("mess-committee-password").value;

        if (email === "mmmut.ac.in" && password === "MMM@23") {
            isMessCommittee = true;
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("mess-committee-container").style.display = "block";
            updateBookedSlots();
            updateHostelManagement();
            updateHostelBookings();
        } else {
            alert("Invalid credentials. Please try again.");
        }
    };

    function updateBookedSlots() {
        bookedSlotsContainer.innerHTML = "";
        const storedBookedSlots = loadFromLocalStorage("bookedSlots") || {};

        for (const user in storedBookedSlots) {
            for (const date in storedBookedSlots[user]) {
                const slots = storedBookedSlots[user][date];
                slots.forEach(slot => {
                    const p = document.createElement("p");
                    p.innerText = `User: ${user}, Booked ${slot} on ${date}`;
                    bookedSlotsContainer.appendChild(p);
                });
            }
        }
    }

    function updateHostelManagement() {
        hostelManagementContainer.innerHTML = "";
        hostels.forEach((hostel, index) => {
            const p = document.createElement("p");
            p.innerText = `Hostel: ${hostel.name}, Capacity: ${hostel.capacity}`;
            const editButton = document.createElement("button");
            editButton.innerText = "Edit";
            editButton.addEventListener("click", function() {
                const newName = prompt("Enter new hostel name:", hostel.name);
                const newCapacity = prompt("Enter new hostel capacity:", hostel.capacity);
                if (newName && newCapacity) {
                    hostels[index] = { name: newName, capacity: parseInt(newCapacity) };
                    saveToLocalStorage("hostels", hostels);
                    updateHostelManagement();
                }
            });
            const deleteButton = document.createElement("button");
            deleteButton.innerText = "Delete";
            deleteButton.addEventListener("click", function() {
                hostels.splice(index, 1);
                saveToLocalStorage("hostels", hostels);
                updateHostelManagement();
            });
            p.appendChild(editButton);
            p.appendChild(deleteButton);
            hostelManagementContainer.appendChild(p);
        });
    }

    function updateHostelBookings() {
        hostelBookingsContainer.innerHTML = "";
        const storedBookedSlots = loadFromLocalStorage("bookedSlots") || {};
        const hostelNames = hostels.map(hostel => hostel.name);

        hostelNames.forEach(hostelName => {
            const hostelSection = document.createElement("section");
            hostelSection.innerHTML = `<h2>${hostelName}</h2>`;
            const hostelSlots = document.createElement("div");

            for (const user in storedBookedSlots) {
                for (const date in storedBookedSlots[user]) {
                    const slots = storedBookedSlots[user][date];
                    slots.forEach(slot => {
                        if (bookedSlots[user][date].includes(slot)) {
                            const p = document.createElement("p");
                            p.innerText = `User: ${user}, Booked ${slot} on ${date}`;
                            hostelSlots.appendChild(p);
                        }
                    });
                }
            }

            hostelSection.appendChild(hostelSlots);
            hostelBookingsContainer.appendChild(hostelSection);
        });
    }

    window.addHostel = function() {
        const name = prompt("Enter hostel name:");
        const capacity = prompt("Enter hostel capacity:");
        if (name && capacity) {
            hostels.push({ name, capacity: parseInt(capacity) });
            saveToLocalStorage("hostels", hostels);
            updateHostelManagement();
        }
    };

    window.showMySlotsPage = function() {
        document.getElementById("main-container").style.display = "none";
        document.getElementById("my-profile-page").style.display = "block";
        updateMySlots();
        updateUserDetails();
    };

    window.showMainPage = function() {
        document.getElementById("my-profile-page").style.display = "none";
        document.getElementById("main-container").style.display = "block";
    };

    function updateUserDetails() {
        const userDetails = document.getElementById("user-details");
        userDetails.innerHTML = `
            <p>Name: ${users[currentUser].name}</p>
            <p>Email: ${currentUser}</p>
            <p>Roll Number: ${users[currentUser].rollNumber}</p>
            <p>Gender: ${users[currentUser].gender}</p>
        `;
    }

    function submitReview() {
        const rating = document.querySelectorAll(".star.active").length;
        const review = reviewText.value;
        if (rating && review) {
            const reviews = loadFromLocalStorage("reviews") || {};
            reviews[currentUser] = { rating, review };
            saveToLocalStorage("reviews", reviews);
            alert("Review submitted successfully!");
            reviewText.value = "";
            document.querySelectorAll(".star").forEach(star => star.classList.remove("active"));
        } else {
            alert("Please provide a rating and review.");
        }
    }

    document.querySelectorAll(".star").forEach(star => {
        star.addEventListener("click", function() {
            const rating = this.getAttribute("data-rating");
            document.querySelectorAll(".star").forEach((s, index) => {
                if (index < rating) {
                    s.classList.add("active");
                } else {
                    s.classList.remove("active");
                }
            });
        });
    });

    profilePhoto.addEventListener("click", function() {
        document.getElementById("main-container").style.display = "none";
        document.getElementById("my-profile-page").style.display = "block";
        updateMySlots();
        updateUserDetails();
    });

    function generateCaptcha() {
        const captcha = Math.random().toString(36).substring(2, 8);
        captchaText.innerText = captcha;
    }

    generateCaptcha();

    updateSlotAvailability();
});

function navigateToNewPage() {
    window.location.href = "loading.html";
    setTimeout(function() {
        window.location.href = "main.html";
    }, 3000);
}

document.getElementById("someButton").addEventListener("click", navigateToNewPage);
