import "./acman-client.js";

const AcmanActivityManager = {
	AcvitivyStatus: {
		New: 0,
		InPause: 1,
		InProgress: 2,
		Done: 3
	},
	/**
	 * @param {object} activity
	 * @param {Guid} activity.id
	 * @param {string} activity.caption
	 * @param {string} activity.jiraUrl
	 * @parma {number} activity.status
	 */
	async addActivity(config) {
		return new Promise(resolve => {
			new MYAPI.ActivityApi().apiActivityAddPost(config,
				(requst, arg1, response) => resolve(response.body));
		});
	},
	async getActivities() {
		//return new Promise(resolve => {
		//	new MYAPI.ActivityApi().apiActivityGetGet((requst, arg1, response) => resolve(response.body));
		//});
		return [
			{
			  "caption": "Рефакторинг кода по Лояльности",
			  "userId": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "user": null,
			  "start": "2019-09-21T17:17:27.7200246+03:00",
			  "end": null,
			  "status": 1,
			  "tags": null,
			  "tagInActivities": null,
			  "endSystemRecordId": "9ed26925-7e7d-4223-a53f-af45e258170f",
			  "isSynchronized": true,
			  "isIntegration": false,
			  "needUpdateRemoteIds": false,
			  "jiraUrl": null,
			  "accountId": null,
			  "account": null,
			  "projectId": null,
			  "project": null,
			  "workInProjectId": null,
			  "workInProject": null,
			  "id": "09f5ebf2-d154-4688-87b8-ebf2016a35e8",
			  "createdById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "createdOn": "2019-09-21T17:17:27.7344012+03:00",
			  "modifiedById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "modifiedOn": "2019-09-21T17:18:13.5994676+03:00",
			  "createdBy": null,
			  "modifiedBy": null,
			  "entityState": 0
			},
			{
			  "caption": "Интеграция с SAP SM",
			  "userId": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "user": null,
			  "start": null,
			  "end": null,
			  "status": 0,
			  "tags": null,
			  "tagInActivities": null,
			  "endSystemRecordId": "7feae0b6-66e5-4b89-a3f5-886be586da51",
			  "isSynchronized": true,
			  "isIntegration": false,
			  "needUpdateRemoteIds": false,
			  "jiraUrl": null,
			  "accountId": null,
			  "account": null,
			  "projectId": null,
			  "project": null,
			  "workInProjectId": null,
			  "workInProject": null,
			  "id": "2bedc7ba-b43f-4939-a515-2c023931a590",
			  "createdById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "createdOn": "2019-09-21T17:17:27.7344012+03:00",
			  "modifiedById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "modifiedOn": "2019-09-21T17:17:45.4751252+03:00",
			  "createdBy": null,
			  "modifiedBy": null,
			  "entityState": 0
			},
			{
			  "caption": "Code review",
			  "userId": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "user": null,
			  "start": "2019-09-21T17:17:27.7342429+03:00",
			  "end": "2019-09-21T17:33:00.7055969+03:00",
			  "status": 3,
			  "tags": null,
			  "tagInActivities": null,
			  "endSystemRecordId": "667b1748-18fc-491c-9ce5-13bce4a9f7b4",
			  "isSynchronized": true,
			  "isIntegration": false,
			  "needUpdateRemoteIds": false,
			  "jiraUrl": null,
			  "accountId": null,
			  "account": null,
			  "projectId": null,
			  "project": null,
			  "workInProjectId": null,
			  "workInProject": null,
			  "id": "bfcf79e8-a7ec-4a04-b2ea-0ad63518eb94",
			  "createdById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "createdOn": "2019-09-21T17:17:27.7344012+03:00",
			  "modifiedById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "modifiedOn": "2019-09-21T17:33:01.4490212+03:00",
			  "createdBy": null,
			  "modifiedBy": null,
			  "entityState": 0
			},
			{
			  "caption": "Архитектура автопланирования, UML",
			  "userId": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "user": null,
			  "start": null,
			  "end": null,
			  "status": 1,
			  "tags": null,
			  "tagInActivities": null,
			  "endSystemRecordId": "71865316-04ff-44eb-b3a1-f1aa93443998",
			  "isSynchronized": true,
			  "isIntegration": false,
			  "needUpdateRemoteIds": false,
			  "jiraUrl": null,
			  "accountId": null,
			  "account": null,
			  "projectId": null,
			  "project": null,
			  "workInProjectId": null,
			  "workInProject": null,
			  "id": "ea55afa1-3f86-4229-afa6-862c1b02f52f",
			  "createdById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "createdOn": "2019-09-21T17:17:27.7344012+03:00",
			  "modifiedById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "modifiedOn": "2019-09-21T17:17:46.6549531+03:00",
			  "createdBy": null,
			  "modifiedBy": null,
			  "entityState": 0
			},
			{
			  "caption": "Test MK",
			  "userId": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "user": null,
			  "start": "2019-09-21T17:18:13.0749146+03:00",
			  "end": "2019-09-21T17:18:26.5415931+03:00",
			  "status": 3,
			  "tags": null,
			  "tagInActivities": null,
			  "endSystemRecordId": "36d7c7fa-deb9-4331-9694-c8ae0309d473",
			  "isSynchronized": true,
			  "isIntegration": false,
			  "needUpdateRemoteIds": false,
			  "jiraUrl": null,
			  "accountId": null,
			  "account": null,
			  "projectId": null,
			  "project": null,
			  "workInProjectId": null,
			  "workInProject": null,
			  "id": "e2c83023-bfb9-439d-b57e-1cb5eb0cbbb2",
			  "createdById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "createdOn": "2019-09-21T17:17:44.0987038+03:00",
			  "modifiedById": "4845097f-57a8-43c6-a189-cd9e9b243701",
			  "modifiedOn": "2019-09-21T17:18:27.1276438+03:00",
			  "createdBy": null,
			  "modifiedBy": null,
			  "entityState": 0
			}
		]
	}
}
window.AcmanActivityManager = AcmanActivityManager;
export default AcmanActivityManager;