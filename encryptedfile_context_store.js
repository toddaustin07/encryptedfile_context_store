'use strict'

const path = require('path')
const fs = require('fs')
const encoding = 'utf-8'
const crypto = require("crypto");

module.exports = class FileContextStore {

	/**
	 * Create a context store instance
	 */
	constructor(secret_key, directory = 'data') {
		this.directory = directory
		if (!fs.existsSync(this.directory)) {
			fs.mkdirSync(this.directory)
		}
		this.encrypter = new Encrypter(secret_key);
	}

	/**
	 * Return the filename of the context store file for the specified installed app instance
	 * @param installedAppId
	 * @returns string
	 */
	filename(installedAppId) {
		return path.join(this.directory, `${installedAppId}.data`)
	}

	/**
	 * Read the context of the installed app instance
	 * @param installedAppId
	 * @returns {Promise<ContextRecord>}
	 */
	get(installedAppId) {
		return new Promise((resolve, reject) => {
			fs.exists(this.filename(installedAppId), (exists) => {
				if (exists) {
					fs.readFile(this.filename(installedAppId), encoding, (err, data) => {
						if (err) {
							reject(err)
						} else {
							
							resolve(JSON.parse(this.encrypter.dencrypt(data)))
						}
					})
				} else {
					resolve({})
				}
			})
		})
	}

	/**
	 * Puts the data into the context store
	 * @param {ContextRecord} params Context object
	 * @returns {Promise<AWS.Request<AWS.DynamoDB.GetItemOutput, AWS.AWSError>>|Promise<Object>}
	 */
	put(params) {
		return new Promise((resolve, reject) => {
				
			fs.writeFile(this.filename(params.installedAppId), this.encrypter.encrypt(JSON.stringify(params)), encoding, (err, data) => {
				if (err) {
					reject(err)
				} else {
					resolve(params)
				}
			})
		})
	}

	/**
	 * Updates the data in the context store by `installedAppId`
	 * @param {String} installedAppId Installed app identifier
	 * @param {ContextRecord} params Context object
	 * @returns {Promise<AWS.Request<AWS.DynamoDB.GetItemOutput, AWS.AWSError>>|Promise<Object>}
	 */
	async update(installedAppId, params) {
		const record = await this.get(installedAppId)
		for (const name of Object.keys(params)) {
			record[name] = params[name]
		}
		return this.put(record)
	}

	/**
	 * Delete the row from the table
	 * @param {String} installedAppId Installed app identifier
	 * @returns {Promise<AWS.Request<AWS.DynamoDB.GetItemOutput, AWS.AWSError>>|Promise<Object>}
	 */
	delete(installedAppId) {
		return new Promise((resolve, reject) => {
			fs.unlink(this.filename(installedAppId), (err) => {
				if (err) {
					reject(err)
				} else {
					resolve()
				}
			})
		})
	}
}

class Encrypter {
  constructor(encryptionKey) {
    this.algorithm = "aes-192-cbc";
    this.key = crypto.scryptSync(encryptionKey, "salt", 24);
  }

  encrypt(clearText) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    const encrypted = cipher.update(clearText, "utf8", "hex");
    return [
      encrypted + cipher.final("hex"),
      Buffer.from(iv).toString("hex"),
    ].join("|");
  }

  dencrypt(encryptedText) {
    const [encrypted, iv] = encryptedText.split("|");
    if (!iv) throw new Error("IV not found");
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, "hex")
    );
    return decipher.update(encrypted, "hex", "utf8") + decipher.final("utf8");
  }
}
