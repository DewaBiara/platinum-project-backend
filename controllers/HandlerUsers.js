import db from "../models/index.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { refreshToken } from "./RefreshToken.js";

const Users = db.Users;

export const handleGetRoot = async (req, res) => {
  res.status(200).json({
    status: "OK",
    message: "Management API For Order Ticketing is Ready",
  });
};

export const getUsers = async (req, res) => {
  try {
    const users = await Users.findAll({
      attributes: [
        "id",
        "firstname",
        "lastname",
        "email",
        "password",
        "role",
        "nohp",
        "birthday",
        "country",
        "province",
        "city",
        "address",
        "postalcode",
        "pictures",
      ],
      // include: [
      //   {
      //     model: Dummy,
      //     attributes: ["firstname", "dummy"],
      //   },
      // ],
    });
    res.json(users);
  } catch (error) {
    console.log(error);
  }
};

export const getUsersById = async (req, res) => {
  try {
    const users = await Users.findOne({
      where: { id: req.params.id },
    });
    res.status(200).json(users);
  } catch (error) {
    console.log(error);
  }
};

export const Register = async (req, res) => {
  const {
    id,
    email,
    firstname,
    lastname,
    nohp,
    birthday,
    country,
    province,
    city,
    address,
    postalcode,
    pictures,
    password,
    confPassword,
    role,
  } = req.body;
  if (password !== confPassword)
    return res
      .status(400)
      .json({ msg: "Password dan Confirm Password tidak cocok" });
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);
  try {
    await Users.create({
      id,
      email,
      firstname,
      lastname,
      nohp,
      birthday,
      country,
      province,
      city,
      address,
      postalcode,
      pictures,
      password: hashPassword,
    });
    res.json({ msg: "Register Berhasil" });
  } catch (error) {
    console.log(error);
  }
};

export const Login = async (req, res) => {
  try {
    const user = await Users.findAll({
      where: {
        email: req.body.email,
      },
    });
    const match = await bcrypt.compare(req.body.password, user[0].password);
    if (!match) return res.status(400).json({ msg: "Wrong Password" });
    const userId = user[0].id;
    const firstname = user[0].firstname;
    const lastname = user[0].lastname;
    const nohp = user[0].nohp;
    const birthday = user[0].birthday;
    const country = user[0].country;
    const province = user[0].province;
    const city = user[0].city;
    const address = user[0].address;
    const postalcode = user[0].postalcode;
    const pictures = user[0].pictures;
    const email = user[0].email;
    const accessToken = jwt.sign(
      {
        userId,
        firstname,
        email,
        lastname,
        nohp,
        birthday,
        country,
        province,
        city,
        address,
        postalcode,
        pictures,
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    const refreshToken = jwt.sign(
      {
        userId,
        firstname,
        email,
        lastname,
        nohp,
        birthday,
        country,
        province,
        city,
        address,
        postalcode,
        pictures,
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "1d",
      }
    );

    await Users.update(
      { refresh_token: refreshToken },
      {
        where: {
          id: userId,
        },
      }
    );
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    });
    res.json({ accessToken });
  } catch (error) {
    res.status(404).json({ msg: "Email tidak ditemukan" });
  }
};

export const Logout = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  if (!refreshToken) return res.sendStatus(204);
  const user = await Users.findAll({
    where: {
      refresh_token: refreshToken,
    },
  });
  if (!user[0]) return res.sendStatus(204);
  const userId = user[0].id;
  await Users.update(
    { refresh_token: null },
    {
      where: {
        id: userId,
      },
    }
  );
  res.clearCookie("refreshToken");
  return res.sendStatus(200);
};

export const whoAmI = async (req, res) => {
  try {
    const currentUser = req.user;
    res.status(200).json(currentUser);
  } catch (error) {
    console.log(error);
  }
};

export const deleteUsers = async (req, res) => {
  if (req.user.role == "buyer") {
    res.status(401).json({
      status: "Unauthorized",
      message: "You are not authorized to delete users",
    });
    return;
  }
  const user = await Users.findAll();
  const { id } = req.params;
  const dataBefore = await Users.findOne({
    where: { id: id },
  });
  const parsedDataProfile = JSON.parse(JSON.stringify(dataBefore));

  if (!parsedDataProfile) {
    return res.status(400).json({
      success: false,
      message: "Users Account doesn't exist or has been deleted!",
    });
  }

  await Users.destroy({
    where: { id },
  });

  return res.status(200).json({
    success: true,
    message: "Delete Data Successfully",
  });
};

export const updateUsers = async (req, res) => {
  const { id } = req.params;
  const dataBeforeDelete = await Users.findOne({
    where: { id: id },
  });
  const parsedDataProfile = JSON.parse(JSON.stringify(dataBeforeDelete));

  if (!parsedDataProfile) {
    return res.status(400).json({
      success: false,
      message: "Users doesn't exist or has been deleted!",
    });
  }

  const {
    email,
    firstname,
    lastname,
    nohp,
    birthday,
    country,
    province,
    city,
    address,
    postalcode,
    pictures,
    password,
    confPassword,
  } = req.body;
  if (password !== confPassword)
    return res
      .status(400)
      .json({ msg: "Password dan Confirm Password tidak cocok" });
  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);
  try {
    await Users.update(
      {
        email,
        firstname,
        lastname,
        nohp,
        birthday,
        country,
        province,
        city,
        address,
        postalcode,
        pictures,
        password: hashPassword,
      },
      {
        where: { id: id },
      }
    );
    return res.status(200).json({
      success: true,
      message: "Users Success Updated",
    });
  } catch (error) {
    console.log(error);
  }
};
