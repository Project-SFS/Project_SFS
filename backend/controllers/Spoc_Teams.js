import connection from "../database/mysql.js";
import AsyncHandler from "../utils/AsyncHandler.js";

const Fetch_Teams = AsyncHandler(async (req, res) => {
   

    const { id } = req.params;
    const [result] = await connection.query("select * from Team_List WHERE SPOC_ID = ?", [id])

    res.send(result)
})

const Fetch_Team_Members = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    
    const parsedId = parseInt(id, 10);
    if (Number.isNaN(parsedId)) {
        return res.status(400).json({ message: 'Invalid team id' });
    }

    // use parameterized query to avoid SQL injection
    const [result, err1] = await connection.query("select * from Team_Members_List where Team_ID = ?", [parsedId]);
    const [mentor, err2] = await connection.query("select MENTOR_NAME, MENTOR_EMAIL from Team_List where ID = ?", [parsedId]);

    res.json({ result: result, mentor: mentor })
})

const Delete_team = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    const [result] = await connection.query("DELETE FROM Team_List WHERE ID = ?", [id])
    res.send(result)
})

const Fetch_Team_For_Students = AsyncHandler(async (req, res) => {
    const { id } = req.body;
    const [data, extra] = await connection.query(`SELECT * FROM Team_List WHERE ID=${id}`)
    res.send(data)
})

const fetch_team_id_email = AsyncHandler(async (req, res) => {
    const { email } = req.body;
    const [data, extra] = await connection.query(`SELECT ID FROM Team_List WHERE LEAD_EMAIL='${email}'`)
  
    res.send(data)
})

export { Fetch_Teams, Fetch_Team_Members, Delete_team, Fetch_Team_For_Students, fetch_team_id_email }