// ─── PrepDeck Legacy Student Auth Adapter ─────────────────────────────
(function () {
    const form = document.querySelector(".login-form");
    if (!form) return;

    form.addEventListener("submit", function (event) {
        event.preventDefault();

        const id = (document.querySelector("#email")?.value || "").trim().toLowerCase();
        const password = document.querySelector("#password")?.value || "";

        if (window.Storage && typeof window.Storage.login === "function") {
            const res = window.Storage.login(id, password);
            if (res.success) {
                window.location.href = res.user.role === "mentor" ? "mentor-dashboard.html" : "student-dashboard.html";
                return;
            }
        }

        // Fallback for standalone evaluation
        if ((id === "student1" && (password === "1234" || password === "123")) ||
            (id === "nikhil" && password === "123")) {
            localStorage.setItem("prepdeck_logged_in", "true");
            localStorage.setItem("prepdeck_student_name", "Nikhil Sharma");
            window.location.href = "student-dashboard.html";
        } else {
            alert("Invalid ID or Password! Use student1 / 123");
        }
    });
})();
