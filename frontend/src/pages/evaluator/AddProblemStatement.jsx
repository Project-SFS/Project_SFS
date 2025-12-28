import axios from "axios";
import { useState } from "react";
import { auth, URL } from "../../Utils";
import {toast,Toaster} from 'react-hot-toast';

const AddProblemStatement = () => {

    const[title,setTitle]=useState("");
    const[description,setDescription]=useState("");
    const[category,setCategory]=useState("");
    const[subDate,setSubDate]=useState("");
    const[reference,setReference]=useState("");


    const handleSubmit=async(e)=>{
        e.preventDefault();
     
      
        try{
           const response = await axios.post(`${URL}/addproblems`,{
            title:title,
            description:description,
            sub_date:subDate,
            category:category,
            reference:reference
            
           }, 
           { withCredentials: true }).then(res => {
             
             
             if (res.status == 200) {
               setTitle("");
               setDescription("");
               setCategory("");
               setSubDate("");
               setReference("")
             }
           })
           toast.success("Problem Statement Added Successfully",{position:"top-center"});
          await axios.post(`${URL}/send_mail_to_spoc`,{Problem:title})
         
        }
        catch(error){
            console.error("Error adding problem statement:",error);
            toast.error("Failed to Add Problem Statement",{position:"top-center"});
        }
    }


  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      
      {/* Content */}
      <div className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="bg-white shadow-md rounded-xl w-full max-w-3xl p-8">
          

          <form className="space-y-5" onSubmit={handleSubmit}>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Title
              </label>
              <input
                type="text"
                placeholder="Enter Problem Statement Title"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-300"
                onChange={(e)=>setTitle(e.target.value)}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                placeholder="Describe the Problem Statement"
                rows="4"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-300"
                onChange={(e)=>setDescription(e.target.value)}
              ></textarea>
            </div>

            {/* Category */}
             <div>
              <label className="block text-sm font-medium text-gray-700">
                Hardware or Software
              </label>

              <select name="hw/sw" id="" onChange={(e) => setDept(e.target.value)} className="mt-1 w-full border border-gray-300  rounded-md p-2  outline-0">
                <option value="">-- choose one --</option>
                <option value="Hardware">Hardware</option>
                <option value="Software">Software</option>
              </select>
             
            </div>


            
            {/* Links */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Reference Link
              </label>
              <input
                type="text"
                placeholder="https://youtube.com/watch?v=..."
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-300"
                onChange={(e)=>setReference(e.target.value)}
              />
            </div>

            {/* Submission Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Enter Submission DeadLine
              </label>
              <input
                type="date"
                placeholder="Submission Deadline"
                className="mt-1 w-full border border-gray-300 rounded-md p-2 focus:ring focus:ring-blue-300"
                onChange={(e)=>setSubDate(e.target.value)}
              />
            </div>

            

            
            {/* Buttons */}
            <div className="flex justify-end space-x-4 pt-4">
              <button
                type="button"
                className="px-5 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      </div>
      <Toaster/>
    </div>
  );
};

export default AddProblemStatement;
