document.addEventListener("DOMContentLoaded", function() {
    const bookingDateInput = document.getElementById("bookingDate");
    const buttons = document.querySelectorAll(".slot-button");
    const hostelSelect = document.getElementById("hostelSelect");
    const darkModeToggle = document.getElementById("darkModeToggle");
    const mySlotsContainer = document.getElementById("mySlotsContainer");
    const bookedSlotsContainer = document.getElementById("bookedSlotsContainer");
    let currentUser = null;
    let isMessCommittee = false;

    let bookedSlots = JSON.parse(localStorage.getItem("bookedSlots")) || {};
    let users = JSON.parse(localStorage.getItem("users")) || {};

    bookingDateInput.valueAsDate = new Date();
    bookingDateInput.addEventListener("change", updateSlotAvailability);

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

            let confirmBooking = confirm(`Do you want to book the ${meal} slot at ${time} in ${hostel} on ${selectedDate}?`);
            if (confirmBooking) {
                this.disabled = true;
                this.innerText = "Booked";
                this.classList.add("booked");
                bookedSlots[currentUser][selectedDate].push(time);
                localStorage.setItem("bookedSlots", JSON.stringify(bookedSlots));
                showPopup(`Your slot for ${meal} at ${time} has been booked.`);
                updateMySlots();
            }
        });
    });

    function showPopup(message) {
        let popup = document.createElement("div");
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
        let section = document.getElementById(sectionId);
        if (section.style.display === "block") {
            section.style.display = "none";
            section.classList.remove("show");
        } else {
            section.style.display = "block";
            setTimeout(() => {
                section.classList.add("show");
            }, 100);
        }
    };

    function saveUsers() {
        localStorage.setItem("users", JSON.stringify(users));
    }

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

        if (users[email] && users[email].password === password) {
            currentUser = email;
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("main-container").style.display = "block";
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
        const gender = document.getElementById("register-gender").value;

        if (email && password && gender) {
            if (users[email]) {
                alert("User already exists! Please log in.");
                return;
            }

            users[email] = { password, gender };
            saveUsers();
            alert("Registration successful! Please log in.");
            showLoginForm();
        } else {
            alert("Please enter valid credentials.");
        }
    };

    window.togglePassword = function(inputId) {
        const passwordInput = document.getElementById(inputId);
        passwordInput.type = passwordInput.type === "password" ? "text" : "password";
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
                            bookedSlots[currentUser][date].splice(index, 1);
                            localStorage.setItem("bookedSlots", JSON.stringify(bookedSlots));
                            updateMySlots();
                            updateSlotAvailability();
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

        if (email === "messcommittee@example.com" && password === "committee123") {
            isMessCommittee = true;
            document.getElementById("auth-container").style.display = "none";
            document.getElementById("mess-committee-container").style.display = "block";
            updateBookedSlots();
        } else {
            alert("Invalid credentials. Please try again.");
        }
    };

    function updateBookedSlots() {
        bookedSlotsContainer.innerHTML = "";
        for (const user in bookedSlots) {
            for (const date in bookedSlots[user]) {
                const slots = bookedSlots[user][date];
                slots.forEach(slot => {
                    const p = document.createElement("p");
                    p.innerText = `User: ${user}, Booked ${slot} on ${date}`;
                    bookedSlotsContainer.appendChild(p);
                });
            }
        }
    }

    updateSlotAvailability();
});
