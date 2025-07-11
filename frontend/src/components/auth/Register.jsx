import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "../../images/default-avatar.svg";

function Registration() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [profileImage, setProfileImage] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validateStep = () => {
    const errors = {};

    if (!firstName.trim()) errors.firstName = ["First name is required"];
    if (!lastName.trim()) errors.lastName = ["Last name is required"];
    if (!nickname.trim()) errors.nickname = ["Username is required"];
    if (!email.trim()) errors.email = ["Email is required"];
    if (!password.trim()) {
      errors.password = ["Password is required"];
    } else {
      const passwordErrors = [];
      if (password.length < 6)
        passwordErrors.push("Password must be at least 6 characters");
      if (!/[A-Za-z]/.test(password))
        passwordErrors.push("Password must include a letter");
      if (!/[A-Z]/.test(password))
        passwordErrors.push("Password must include a Capital letter");
      if (!/[0-9]/.test(password))
        passwordErrors.push("Password must include a number");
      if (!/[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]/.test(password))
        passwordErrors.push("Password must include a special character");
      if (passwordErrors.length > 0) errors.password = passwordErrors;
    }

    if (!age.trim()) {
      errors.dateOfBirth = ["Date of Birth is required"];
    } else {
      const parsedDate = new Date(age);
      if (isNaN(parsedDate.getTime())) {
        errors.dateOfBirth = ["Invalid date"];
      } else if (parsedDate > new Date()) {
        errors.dateOfBirth = ["Date of birth cannot be in the future"];
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const registerMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("nickname", nickname);
      formData.append("dateOfBirth", age);
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const res = await axios.post("http://localhost:8080/register", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      return res.data;
    },
    onSuccess: (data) => {
      console.log("Registration successful:", data), navigate("/login");
    },
    onError: (error) => {
      const errors = error.response?.data?.errors;

      if (errors) {
        setFieldErrors(errors);
      } else {
        setFieldErrors({
          general: ["Something went wrong. Try again."],
        });
      }
      console.log("Register Errors:", errors);
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step === 1) {
      const valid = validateStep();
      // setFieldErrors({});
      if (!valid) {
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      registerMutation.mutate();
    }
  };

  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white text-gray-800 rounded-2xl shadow-lg w-full max-w-xl p-8 space-y-6"
      >
        <h2 className="text-center text-2xl font-bold">Register</h2>
        <p className="text-center text-sm text-gray-500">Step {step} of 3</p>

        {/* Step 1 */}
        {step === 1 && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {fieldErrors.firstName &&
                  Array.isArray(fieldErrors.firstName) && (
                    <ul className="text-red-500 text-sm mt-1 space-y-1">
                      {fieldErrors.firstName.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  )}
              </div>
              <div>
                <label className="block text-sm mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                {fieldErrors.lastName &&
                  Array.isArray(fieldErrors.lastName) && (
                    <ul className="text-red-500 text-sm mt-1 space-y-1">
                      {fieldErrors.lastName.map((msg, i) => (
                        <li key={i}>{msg}</li>
                      ))}
                    </ul>
                  )}
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Username</label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {fieldErrors.nickname && Array.isArray(fieldErrors.nickname) && (
                <ul className="text-red-500 text-sm mt-1 space-y-1">
                  {fieldErrors.nickname.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {fieldErrors.email && Array.isArray(fieldErrors.email) && (
                <ul className="text-red-500 text-sm mt-1 space-y-1">
                  {fieldErrors.email.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {fieldErrors.password && Array.isArray(fieldErrors.password) && (
                <ul className="text-red-500 text-sm mt-1 space-y-1">
                  {fieldErrors.password.map((msg, i) => (
                    <li key={i}>{msg}</li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <label className="block text-sm mb-1">Date of Birth</label>
              <input
                type="date"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
              {fieldErrors.dateOfBirth &&
                Array.isArray(fieldErrors.dateOfBirth) && (
                  <ul className="text-red-500 text-sm mt-1 space-y-1">
                    {fieldErrors.dateOfBirth.map((msg, i) => (
                      <li key={i}>{msg}</li>
                    ))}
                  </ul>
                )}
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4 text-center">
            <p className="text-sm">Upload Profile Picture</p>
            <label
              htmlFor="profileImageUpload"
              className="inline-flex items-center gap-2 cursor-pointer text-indigo-600 hover:text-indigo-800 text-sm"
            >
              <img
                src={
                  profileImage
                    ? URL.createObjectURL(profileImage)
                    : defaultAvatar
                }
                alt="Profile"
                className="w-24 h-24 mx-auto rounded-full border border-gray-300 object-cover"
              />
            </label>
            <input
              id="profileImageUpload"
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files[0])}
              className="hidden"
            />
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div className="text-center text-gray-500 h-32 flex items-center justify-center border border-dashed rounded bg-white">
            <p>
              Not handled yet probably about me or something like it suggests
              users for you to follow based on interests you choose i think that
              would be cool
            </p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-between pt-4">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="px-4 py-2 rounded bg-gray-300 hover:bg-gray-400 text-gray-700"
            >
              Back
            </button>
          ) : (
            <div />
          )}

          <button
            type="submit"
            className="px-4 py-2 rounded bg-indigo-500 hover:bg-indigo-600 text-white font-semibold"
          >
            {step === 3
              ? registerMutation.isPending
                ? "Submitting..."
                : "Register"
              : "Next"}
          </button>
        </div>

        {registerMutation.isError && Object.keys(fieldErrors).length === 0 && (
          <p className="text-red-500 mt-2 text-center">
            Something went wrong. Please try again.
          </p>
        )}
        <div className="flex justify-center">
          <p>
            Already have an account? {"  "}
            <Link
              to="/login"
              className="text-indigo-600 hover:underline font-medium"
            >
              Login
            </Link>
          </p>

        </div>
      </form>
    </div>
  );
}

export default Registration;