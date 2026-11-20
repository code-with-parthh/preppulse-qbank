const students = [
    { id: "student1", password: "1234", name: "Student" },
    { id: "anish", password: "abcd", name: "Anish" }
];

const form = document.querySelector(".login-form");

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const id = document.querySelector("#email").value.trim().toLowerCase();
    const password = document.querySelector("#password").value;

    const user = students.find(s => s.id === id && s.password === password);

    if (user) {
        // Remember the session so the dashboard knows who is logged in
        localStorage.setItem("prepdeck_logged_in", "true");
        localStorage.setItem("prepdeck_student_name", user.name);
        window.location.href = "student dashboard.html";  // same folder as this page
    } else {
        alert("Invalid ID or Password!");
    }
});