const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://admin:pass@ewon.kmyoknu.mongodb.net/dams_WL", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// Define a Mongoose schema
const damSchema = new mongoose.Schema({
  id: Number,
  name: String,
  code_name: String,
  project_name: String,
  district: String,
  sub_district: String,
  province: String,
  started_construction: String,
  finished_construction: String,
  reservoir_area: String,
  rainwater_receiving_area: String,
  dam_width: String,
  dam_height: String,
  maximum_capacity: String, // You can adjust this data type based on your actual data
  catchment_capacity: String, // You can adjust this data type based on your actual data
  dam_level: String,
  highest_water_level: String,
  dam_length: String,
  catchment_level: String,
  lowest_water_level: String,
  wcocl: String,
  wcohwl: String,
  over_catchment_level: String,
  created_at: Date,
  updated_at: Date,
  is_active: Boolean,
  has_weather_station: Boolean,
  center: {
    lat: Number,
    lng: Number,
  },
  marker: {
    lat: Number,
    lng: Number,
  },
  status: String,
  youtube_link: String, // You can adjust this data type based on your actual data
  step: String,
  is_dam_detail_active: Boolean,
  be_under: String,
  is_dam_information: Boolean,
  is_ftp: Boolean,
  is_instrument: Boolean,
  is_aaa: Boolean,
  is_data_mapper: Boolean,
  Username: String,
  Password: String,
});

// Create a Mongoose model based on the schema
const DamModel = mongoose.model("Dam", damSchema);

module.exports = DamModel;
