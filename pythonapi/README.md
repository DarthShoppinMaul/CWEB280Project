# FastAPI Project



## 🚀 Getting Started

## Folder Structure
py_fastapi/
├── app/
│   ├── __init__.py         # specify that folder is a python module
│   ├── main.py             # FastAPI app initialization, root routes
│   │   config.py           # Application settings and environment variables
│   ├── api/
│   │   ├── __init__.py
│   │   ├── some_endpoints.py   # FastAPI APIRouters for specific endpoints
│   ├── services/
│   │   ├── __init__.py
│   │   ├── some_service.py    # Encapsulates business logic for some feature usually called by some_endpoints
├── tests/                      #follows folder structure of app but each file begins with "test_"
│   ├── api/
│   │   ├── test_some_endpoints.py   # tests FastAPI APIRouters for specific endpoints
│   ├── services/
│   │   ├── test_some_service.py    # test encapsulated business logic for some feature usually called by some_endpoints
├── .env                    # Environment variables
├── requirements.txt        # Project dependencies
├── docker-compose.yml      # Docker compose file for starting docker containers usually a database server
├── README.md               # Project documentation

## Prerequisites - Run as ADMIN
- python 3.12+ [Python 3.12](https://www.python.org/downloads/release/python-31211/)
- Git for windows is installed
  (download from [Git for window](https://github.com/git-for-windows/git/releases/download/v2.49.0.windows.1/Git-2.49.0-64-bit.exe) )

- Windows Subsystem For Linux is updated 
```terminal
wsl --update
wsl --shutdown
```
- Docker Desktop installed on your system
  (download from Microsoft store: [Docker Dektop](https://apps.microsoft.com/detail/XP8CBJ40XLBWKX?hl=en-CA&gl=CA&ocid=pdpshare))

- Ollama for windows installed on your system
(download from [Ollam for windows](https://ollama.com/download/windows))

- Microsoft C++ Build tools
(download from [Microsoft C++ Build Tools](https://aka.ms/vs/17/release/vs_BuildTools.exe))
```
Run vs_BuildTools.exe
In "Workloads" tab 
Select "Desktop development with c++"
Click Install
```

## Recommended Extensions
- PyCharm Docker plugin (should be in there by default)


### Step 1: (ONLY ONE TIME) Clone the Repository
```terminal
git clone https://bitbucket.org/cstprojects/<your project repo name>.git
cd <your project repo name>
git fetch
git branch <your new branch name>
git checkout <your new branch name>
```
### Step 2: (ONLY ONE TIME) Setup Python virtual environment and install packages
Open terminal ensure you are in your project repo directory and run the following commands:
```termimal
cd py_fastapi
py -3.12 -m pip install --upgrade setuptools
py -3.12 -m venv --upgrade-deps .venv
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
.venv\Scripts\activate
python -m pip install r requirements.txt 
```


### Step 3: Start the fastapi project
open terminal ensure you are in `py_fastapi` directory and run the following commands:
```
cd py_fastapi
.venv\Scripts\activate
python main.py
```

### Step 4: Access the Application
- [FastAPI Swagger UI](http://localhost:8080/docs)
- [mysql datbase admin](http://localhost:8000)  mysqlport url http://mysqldb:3306

