let students = [
    {
        id: "student1",
        password: "1234"
    },
    {
        id: "anish",
        password: "abcd"
    }
];

let form = document.querySelector(".login-form");

form.addEventListener("submit", function (event) {

    event.preventDefault();

    let id = document.querySelector("#email").value;
    let password = document.querySelector("#password").value;

    let user = students.find(function (student) {
        return student.id === id && student.password === password;
    });

    if (user) {
        alert("Login successful!");

        window.location.href = "student-dashboard.html";
    }
    else {
        alert("Invalid ID or Password!");
    }

});