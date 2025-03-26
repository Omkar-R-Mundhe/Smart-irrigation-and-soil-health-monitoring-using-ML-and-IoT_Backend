import express from "express";
import axios from "axios";
import bodyParser from "body-parser";

const app = express();
app.use(bodyParser.json());

let latestIrrigationPrediction = {
  required: false,
  suggestion: "No Irrigation Needed",
};
let latestFertilizerPrediction = {
  required: false,
  nitrogen_status: "Unknown",
  phosphorus_status: "Unknown",
  potassium_status: "Unknown",
  nitrogen_recommendation: "N/A",
  phosphorus_recommendation: "N/A",
  potassium_recommendation: "N/A",
};

app.post("/sensor-data", async (req, res) => {
  const { temperature, humidity, soil_moisture, N, P, K } = req.body;

  try {
    // Send data to the IRRIGATION MODEL
    const irrigationResponse = await axios.post(
      "https://smart-irrigation-and-soil-health.onrender.com/predict_irrigation",
      {
        moisture: soil_moisture,
        temperature,
        humidity,
      }
    );

    latestIrrigationPrediction = {
      required: irrigationResponse.data["Irrigation Required"],
      suggestion: irrigationResponse.data["Water Suggestion"],
    };

    // Send data to the FERTILIZER MODEL
    const fertilizerResponse = await axios.post(
      "https://smart-irrigation-and-soil-health.onrender.com/predict_fertiliser",
      {
        nitrogen: N,
        phosphorus: P,
        potassium: K,
      }
    );

    latestFertilizerPrediction = {
      required:
        fertilizerResponse.data["Fertilizer Prediction"] ===
        "Fertilizer Required",
      nitrogen_status: fertilizerResponse.data["Nitrogen Status"],
      phosphorus_status: fertilizerResponse.data["Phosphorus Status"],
      potassium_status: fertilizerResponse.data["Potassium Status"],
      nitrogen_recommendation:
        fertilizerResponse.data["Nitrogen Recommendation"],
      phosphorus_recommendation:
        fertilizerResponse.data["Phosphorus Recommendation"],
      potassium_recommendation:
        fertilizerResponse.data["Potassium Recommendation"],
    };

    res.json({
      irrigation_prediction: latestIrrigationPrediction,
      fertilizer_prediction: latestFertilizerPrediction,
    });
  } catch (error) {
    console.error("Error sending data to ML models:", error);
    res.status(500).json({ error: "Failed to get predictions" });
  }
});

// API for ESP8266 to check the latest irrigation decision
app.get("/latest-irrigation", (req, res) => {
  res.json(latestIrrigationPrediction);
});

// API for React Dashboard to get predictions
app.get("/predictions", (req, res) => {
  res.json({
    irrigation_prediction: latestIrrigationPrediction,
    fertilizer_prediction: latestFertilizerPrediction,
  });
});

app.get("/", (req, res) => {
  res.send("It is running!");
});

app.listen(5000, () => console.log("Backend running on port 5000"));
