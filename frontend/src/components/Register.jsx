import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Registration() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [profileImage, setProfileImage] = useState(null);

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
    onSuccess: (data) => {console.log("Registration successful:", data) , 
      navigate("/login")
    },
    onError: (error) =>
      console.error(
        "Registration failed:",
        error.response?.data || error.message
      ),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (step < 3) return setStep(step + 1);
  registerMutation.mutate();
  };

  const back = () => setStep((prev) => Math.max(prev - 1, 1));

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-900">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-100 text-gray-800 rounded-2xl shadow-lg w-full max-w-xl p-8 space-y-6"
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
              </div>
              <div>
                <label className="block text-sm mb-1">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
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
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Date of Birth</label>
              <input
                type="date"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
          </>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div className="space-y-4 text-center">
            <p className="text-sm">Upload Profile Picture</p>
            <img
              src={
              "../"
              }
              alt="Profile"
              className="w-24 h-24 mx-auto rounded-full border border-gray-300 object-cover"
            />
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files[0])}
              className="w-full mt-4 text-sm text-gray-600"
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

        {registerMutation.isError && (
          <p className="text-red-500 mt-2 text-center">
            {registerMutation.error.response?.data || "Something went wrong"}
          </p>
        )}
      </form>
    </div>
  );
}

export default Registration;