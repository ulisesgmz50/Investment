function insertMovement(id,user,company,amount){
    if(investtotal < investedtotal+amount){
console.log("llego al total de inversiones");
    }else {
        return "insert into movements VALUES (" + id + "," + user + "," + company + "," + amount +")";
    }
}
const insertMovement